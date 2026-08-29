# Full-width layout + 房間工作區 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 拎走全 app 嘅 `max-w-5xl` 闊度局限,並且將房間詳情頁改做兩欄工作區(中間物品、右邊傢俬),方便喺同一頁管理成間房嘅傢俬同物品。

**Architecture:** 全闊改動淨係喺 `app/layout.tsx` 同 `components/AppHeader.tsx` 拎走 `max-w-5xl` class。房間工作區就靠新增嘅 `lib/db/items.ts::listItemsInRoom` 一次過攞晒成間房嘅物品,喺 server component(`app/rooms/[id]/page.tsx`)分組做 `Record<furnitureId, Item[]>`,再傳落新嘅 client component `components/RoomWorkspace.tsx`,用 `useState` 記住揀選緊邊件傢俬,純用已有 data 做即時切換(唔使再 fetch)。

**Tech Stack:** Next.js 16(App Router,React Server Components + Server Actions)、React 19、Tailwind CSS 4、Supabase(`@supabase/supabase-js`)、Vitest + Testing Library(`jsdom` environment for component tests)。

## Global Constraints

- 所有新 UI 文字用繁體中文(粵語口語風格),同現有頁面一致(例如「仲未有」「新增緊…」呢種語氣)。
- 淨係用現有 Tailwind design tokens(`bg-surface`、`text-ink` / `text-ink-muted` / `text-ink-faint`、`border-border`、`bg-accent`、`font-heading` / `font-caption`),唔好新增顏色或者字體。
- Mutation(新增/編輯/刪除)一律用返現有嘅 Server Actions 模式(`"use server"` function + `revalidatePath`),唔好改用 client-side fetch。
- 讀取資料嘅函數(`lib/db/*.ts`)出錯就 `throw new Error(...)`,交俾 Next.js 嘅 `error.tsx` 處理 — 呢個係現有一致做法,唔好加 try/catch 吞錯誤。
- 新組件同新函數嘅測試,跟現有測試檔案嘅風格(`lib/db/*.test.ts` 用真實 Supabase dev DB 做 integration test;component test 用 `@vitest-environment jsdom` + Testing Library,參考 `components/SearchableSelect.test.tsx`)。

---

### Task 1: 全 app 拎走 `max-w-5xl` 闊度局限

**Files:**
- Modify: `app/layout.tsx:34`
- Modify: `components/AppHeader.tsx:14`

**Interfaces:**
- 呢個 task 淨係改 CSS class,冇新增/改動任何 function signature。

- [ ] **Step 1: 改 `app/layout.tsx`**

將第 34 行:

```tsx
      <body className="min-h-screen bg-bg text-ink antialiased">
        <AppHeader rooms={rooms} />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
```

改做:

```tsx
      <body className="min-h-screen bg-bg text-ink antialiased">
        <AppHeader rooms={rooms} />
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </body>
```

- [ ] **Step 2: 改 `components/AppHeader.tsx`**

將第 14 行:

```tsx
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
```

改做:

```tsx
    <header className="border-b border-border bg-surface">
      <div className="flex items-center gap-4 px-4 py-3 lg:px-8">
```

- [ ] **Step 3: 跑現有測試,確保冇改壞邏輯**

Run: `npm test`
Expected: 全部測試繼續 PASS(呢個 task 淨係改 layout class,冇改任何被測試嘅邏輯)。

- [ ] **Step 4: 用瀏覽器人手核對**

開 dev server(`npm run dev`),用瀏覽器打開首頁、`/items`、任何一個 `/rooms/[id]`、`/settings`,喺闊螢幕(例如 1440px)睇下個 header 同 main content 係咪已經頂到去畫面兩邊(唔再局限喺中間 `max-w-5xl`),而且內容冇貼晒去邊,睇落舒服。

- [ ] **Step 5: Commit**

```bash
rtk git add app/layout.tsx components/AppHeader.tsx
rtk git commit -m "feat: remove max-w-5xl width cap app-wide"
```

---

### Task 2: 新增 `listItemsInRoom` 資料函數

**Files:**
- Modify: `lib/db/items.ts`
- Test: `lib/db/items.test.ts`

**Interfaces:**
- Produces: `listItemsInRoom(roomId: number): Promise<Item[]>` — 一次過攞晒某個房間入面、跨所有傢俬嘅全部物品,每件 `Item` 都帶返自己嘅 `furnitureId`。

- [ ] **Step 1: 寫失敗嘅測試**

喺 `lib/db/items.test.ts`,將第 5 行嘅 import:

```ts
import { listItemsInFurniture, createItem, updateItem, deleteItem } from "./items";
```

改做:

```ts
import { listItemsInFurniture, listItemsInRoom, createItem, updateItem, deleteItem } from "./items";
```

喺檔案最尾(第 88 行 `});` 之前)加呢個新測試:

```ts
  it("lists every item across all furniture pieces in the room", async () => {
    const otherFurnitureId = (await addFurnitureByName(roomId, `物品測試櫃二-${Date.now()}`)).id;
    await createItem({ furnitureId: otherFurnitureId, name: "房間測試物品" });

    const items = await listItemsInRoom(roomId);
    const names = items.map((i) => i.name);
    expect(names).toContain("罐頭");
    expect(names).toContain("房間測試物品");
    expect(items.every((i) => i.furnitureId === furnitureId || i.furnitureId === otherFurnitureId)).toBe(
      true,
    );
  });
```

- [ ] **Step 2: 跑測試,確認佢失敗**

Run: `npx vitest run lib/db/items.test.ts`
Expected: FAIL,錯誤話 `listItemsInRoom` 唔存在 / 冇 export(TypeScript 編譯錯誤或者 import undefined)。

- [ ] **Step 3: 喺 `lib/db/items.ts` 加返 `listItemsInRoom`**

喺 `listItemsInFurniture`(第 71-80 行)之後加呢個新 function:

```ts
export async function listItemsInRoom(roomId: number): Promise<Item[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .select(`${SELECT},furniture!inner(room_id)`)
    .eq("furniture.room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`讀取物品失敗:${error.message}`);
  return (data as unknown as ItemRow[]).map(mapItem);
}
```

- [ ] **Step 4: 跑測試,確認佢成功**

Run: `npx vitest run lib/db/items.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add lib/db/items.ts lib/db/items.test.ts
rtk git commit -m "feat: add listItemsInRoom to fetch every item across a room's furniture"
```

---

### Task 3: Item actions 完成之後,連埋房間頁一齊 revalidate

**Files:**
- Modify: `app/actions/items.ts`

**Interfaces:**
- Consumes: `getFurniture(id: number): Promise<(Furniture & { roomName: string }) | null>`(嚟自 `lib/db/furniture.ts`,已經存在,`deleteFurnitureAction` 已經用緊呢個做法)。返回值嘅 `roomId` 欄位嚟自 `Furniture` type(`lib/db/types.ts`)。

**背景:** 而家 `createItemAction`/`updateItemAction`/`deleteItemAction` 淨係 `revalidatePath('/furniture/${furnitureId}')`。Task 5 之後,呢啲 action 會由房間頁(`/rooms/[id]`)觸發,所以要連埋房間路徑都 revalidate,唔係嘅話新增/刪除完物品,房間頁會顯示舊資料,要手動 refresh 先見到。呢個 action 檔案冇獨立單元測試(同 `deleteFurnitureAction` 一致嘅現有做法),用 Task 5 嘅瀏覽器人手核對嚟驗證。

- [ ] **Step 1: 加 import**

喺 `app/actions/items.ts` 第 4 行之後加:

```ts
import { getFurniture } from "@/lib/db/furniture";
```

- [ ] **Step 2: 改 `createItemAction`**

將:

```ts
export async function createItemAction(formData: FormData) {
  const furnitureId = requiredNumber(formData, "furnitureId");
  await createItem({
    furnitureId,
    name: requiredText(formData, "name"),
    quantity: optionalNumber(formData, "quantity") ?? 1,
    expiryDate: optionalText(formData, "expiryDate"),
    ...categoryFrom(formData),
  });

  revalidatePath(`/furniture/${furnitureId}`);
  revalidatePath("/items");
  revalidatePath("/");
}
```

改做:

```ts
export async function createItemAction(formData: FormData) {
  const furnitureId = requiredNumber(formData, "furnitureId");
  const furniture = await getFurniture(furnitureId);
  await createItem({
    furnitureId,
    name: requiredText(formData, "name"),
    quantity: optionalNumber(formData, "quantity") ?? 1,
    expiryDate: optionalText(formData, "expiryDate"),
    ...categoryFrom(formData),
  });

  revalidatePath(`/furniture/${furnitureId}`);
  if (furniture) revalidatePath(`/rooms/${furniture.roomId}`);
  revalidatePath("/items");
  revalidatePath("/");
}
```

- [ ] **Step 3: 改 `updateItemAction`**

將:

```ts
export async function updateItemAction(formData: FormData) {
  const id = requiredNumber(formData, "id");
  const furnitureId = requiredNumber(formData, "furnitureId");
  await updateItem(id, {
    name: requiredText(formData, "name"),
    quantity: optionalNumber(formData, "quantity") ?? 1,
    expiryDate: optionalText(formData, "expiryDate"),
    ...categoryFrom(formData),
  });

  revalidatePath(`/furniture/${furnitureId}`);
  revalidatePath("/items");
  revalidatePath("/");
}
```

改做:

```ts
export async function updateItemAction(formData: FormData) {
  const id = requiredNumber(formData, "id");
  const furnitureId = requiredNumber(formData, "furnitureId");
  const furniture = await getFurniture(furnitureId);
  await updateItem(id, {
    name: requiredText(formData, "name"),
    quantity: optionalNumber(formData, "quantity") ?? 1,
    expiryDate: optionalText(formData, "expiryDate"),
    ...categoryFrom(formData),
  });

  revalidatePath(`/furniture/${furnitureId}`);
  if (furniture) revalidatePath(`/rooms/${furniture.roomId}`);
  revalidatePath("/items");
  revalidatePath("/");
}
```

- [ ] **Step 4: 改 `deleteItemAction`**

將:

```ts
export async function deleteItemAction(formData: FormData) {
  const furnitureId = requiredNumber(formData, "furnitureId");
  await deleteItem(requiredNumber(formData, "id"));

  revalidatePath(`/furniture/${furnitureId}`);
  revalidatePath("/items");
  revalidatePath("/");
}
```

改做:

```ts
export async function deleteItemAction(formData: FormData) {
  const furnitureId = requiredNumber(formData, "furnitureId");
  const furniture = await getFurniture(furnitureId);
  await deleteItem(requiredNumber(formData, "id"));

  revalidatePath(`/furniture/${furnitureId}`);
  if (furniture) revalidatePath(`/rooms/${furniture.roomId}`);
  revalidatePath("/items");
  revalidatePath("/");
}
```

- [ ] **Step 5: 跑現有測試,確保冇改壞邏輯**

Run: `npm test`
Expected: 全部測試繼續 PASS。

- [ ] **Step 6: Commit**

```bash
rtk git add app/actions/items.ts
rtk git commit -m "fix: revalidate the room page after item create/update/delete"
```

---

### Task 4: 新增 `RoomWorkspace` 組件(兩欄互動工作區)

**Files:**
- Create: `components/RoomWorkspace.tsx`
- Test: `components/RoomWorkspace.test.tsx`

**Interfaces:**
- Consumes:
  - `FurnitureSummary`(`lib/db/furniture.ts`):`{ id, roomId, furnitureTypeId, customName, displayName, iconKey, itemCount }`
  - `Item`(`lib/db/types.ts`):`{ id, furnitureId, categoryId, categoryName, name, quantity, expiryDate }`
  - `Category`(`lib/db/types.ts`):`{ id, name }`
  - `ItemRow`(`components/ItemRow.tsx`):`{ item: Item, furnitureId: number }`
  - `ItemForm`(`components/ItemForm.tsx`):`{ furnitureId, categories, itemNamesByCategoryId, item?, action, submitLabel }`
  - `addFurnitureAction`、`deleteFurnitureAction`(`app/actions/furniture.ts`)
  - `createItemAction`(`app/actions/items.ts`)
- Produces: `RoomWorkspace(props): JSX.Element`,props 為 `{ roomId: number; furniture: FurnitureSummary[]; itemsByFurnitureId: Record<number, Item[]>; categories: Category[]; itemNamesByCategoryId: Record<number, string[]> }`。Task 5 會用呢個 signature。

- [ ] **Step 1: 寫失敗嘅測試**

建立 `components/RoomWorkspace.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoomWorkspace } from "./RoomWorkspace";
import type { Item } from "@/lib/db/types";
import type { FurnitureSummary } from "@/lib/db/furniture";

afterEach(cleanup);

function furniturePiece(id: number, displayName: string, itemCount: number): FurnitureSummary {
  return {
    id,
    roomId: 1,
    furnitureTypeId: 1,
    customName: null,
    displayName,
    iconKey: "box",
    itemCount,
  };
}

function item(id: number, furnitureId: number, name: string): Item {
  return { id, furnitureId, categoryId: null, categoryName: null, name, quantity: 1, expiryDate: null };
}

describe("RoomWorkspace", () => {
  it("defaults to the first furniture piece and shows its items", () => {
    render(
      <RoomWorkspace
        roomId={1}
        furniture={[furniturePiece(1, "衣櫃", 1), furniturePiece(2, "床頭櫃", 1)]}
        itemsByFurnitureId={{ 1: [item(10, 1, "冬季外套")], 2: [item(20, 2, "眼罩")] }}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    expect(screen.getByText("冬季外套")).toBeDefined();
    expect(screen.queryByText("眼罩")).toBeNull();
  });

  it("switches the shown items when another furniture piece is selected", async () => {
    const user = userEvent.setup();
    render(
      <RoomWorkspace
        roomId={1}
        furniture={[furniturePiece(1, "衣櫃", 1), furniturePiece(2, "床頭櫃", 1)]}
        itemsByFurnitureId={{ 1: [item(10, 1, "冬季外套")], 2: [item(20, 2, "眼罩")] }}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "選擇床頭櫃" }));

    expect(screen.getByText("眼罩")).toBeDefined();
    expect(screen.queryByText("冬季外套")).toBeNull();
  });

  it("shows a prompt instead of the item form when the room has no furniture", () => {
    render(
      <RoomWorkspace
        roomId={1}
        furniture={[]}
        itemsByFurnitureId={{}}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    expect(screen.getByText("仲未有傢俬,右邊新增一件先。")).toBeDefined();
    expect(screen.queryByLabelText("物品名稱")).toBeNull();
  });

  it("falls back to the first remaining furniture piece once the selected one disappears", () => {
    const { rerender } = render(
      <RoomWorkspace
        roomId={1}
        furniture={[furniturePiece(1, "衣櫃", 1), furniturePiece(2, "床頭櫃", 1)]}
        itemsByFurnitureId={{ 1: [item(10, 1, "冬季外套")], 2: [item(20, 2, "眼罩")] }}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    rerender(
      <RoomWorkspace
        roomId={1}
        furniture={[furniturePiece(1, "衣櫃", 1)]}
        itemsByFurnitureId={{ 1: [item(10, 1, "冬季外套")] }}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    expect(screen.getByText("冬季外套")).toBeDefined();
  });
});
```

- [ ] **Step 2: 跑測試,確認佢失敗**

Run: `npx vitest run components/RoomWorkspace.test.tsx`
Expected: FAIL(`./RoomWorkspace` 呢個 module 唔存在)。

- [ ] **Step 3: 建立 `components/RoomWorkspace.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { FurnitureIcon } from "./FurnitureIcon";
import { SubmitButton } from "./SubmitButton";
import { ItemRow } from "./ItemRow";
import { ItemForm } from "./ItemForm";
import { addFurnitureAction, deleteFurnitureAction } from "@/app/actions/furniture";
import { createItemAction } from "@/app/actions/items";
import type { Category, Item } from "@/lib/db/types";
import type { FurnitureSummary } from "@/lib/db/furniture";

export function RoomWorkspace({
  roomId,
  furniture,
  itemsByFurnitureId,
  categories,
  itemNamesByCategoryId,
}: {
  roomId: number;
  furniture: FurnitureSummary[];
  itemsByFurnitureId: Record<number, Item[]>;
  categories: Category[];
  itemNamesByCategoryId: Record<number, string[]>;
}) {
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<number | null>(
    furniture[0]?.id ?? null,
  );

  const activeFurnitureId =
    selectedFurnitureId !== null && furniture.some((f) => f.id === selectedFurnitureId)
      ? selectedFurnitureId
      : (furniture[0]?.id ?? null);
  const activeFurniture = furniture.find((f) => f.id === activeFurnitureId) ?? null;
  const activeItems = activeFurniture ? (itemsByFurnitureId[activeFurniture.id] ?? []) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="order-2 lg:order-1">
        <h2 className="mb-3 font-heading font-semibold text-ink">
          {activeFurniture ? `${activeFurniture.displayName} 嘅物品(${activeItems.length})` : "物品"}
        </h2>

        {activeFurniture ? (
          <>
            {activeItems.length === 0 ? (
              <p className="mb-4 rounded-md border border-dashed border-border p-6 text-center font-caption text-ink-faint">
                仲未有物品。
              </p>
            ) : (
              <ul className="mb-4 rounded-md border border-border bg-surface px-4">
                {activeItems.map((item) => (
                  <ItemRow key={item.id} item={item} furnitureId={activeFurniture.id} />
                ))}
              </ul>
            )}

            <ItemForm
              furnitureId={activeFurniture.id}
              categories={categories}
              itemNamesByCategoryId={itemNamesByCategoryId}
              action={createItemAction}
              submitLabel="新增物品"
            />
          </>
        ) : (
          <p className="rounded-md border border-dashed border-border p-6 text-center font-caption text-ink-faint">
            仲未有傢俬,右邊新增一件先。
          </p>
        )}
      </section>

      <section className="order-1 lg:order-2">
        <h2 className="mb-3 font-heading font-semibold text-ink">傢俬({furniture.length})</h2>

        {furniture.length > 0 && (
          <ul className="mb-4 flex flex-col gap-2">
            {furniture.map((item) => (
              <li key={item.id}>
                <div
                  className={`flex items-center justify-between rounded-md border p-3 ${
                    item.id === activeFurniture?.id
                      ? "border-accent bg-surface-mist"
                      : "border-border bg-surface"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFurnitureId(item.id)}
                    aria-pressed={item.id === activeFurniture?.id}
                    aria-label={`選擇${item.displayName}`}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <FurnitureIcon iconKey={item.iconKey} className="h-5 w-5 text-ink-muted" />
                    <div>
                      <p className="font-medium text-ink">{item.displayName}</p>
                      <p className="text-sm font-caption text-ink-muted">{item.itemCount} 件物品</p>
                    </div>
                  </button>
                  <form action={deleteFurnitureAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton
                      className="rounded-sm p-2 text-ink-faint hover:bg-red-50 hover:text-red-600"
                      aria-label={`刪除${item.displayName}`}
                      pendingChildren={<Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form action={addFurnitureAction} className="flex flex-col gap-2">
          <input type="hidden" name="roomId" value={roomId} />
          <div>
            <label htmlFor="furnitureTypeName" className="mb-1 block text-sm font-caption text-ink-muted">
              新增傢俬
            </label>
            <input
              id="furnitureTypeName"
              name="furnitureTypeName"
              placeholder="例如:衣櫃"
              className="w-full rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
              required
            />
          </div>
          <SubmitButton
            className="inline-flex h-11 items-center justify-center gap-1 rounded-sm bg-accent px-3 text-sm font-caption font-semibold text-white hover:bg-accent-light"
            pendingChildren={
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                新增緊…
              </>
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            新增
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: 跑測試,確認佢成功**

Run: `npx vitest run components/RoomWorkspace.test.tsx`
Expected: PASS(4 個測試全部通過)。

- [ ] **Step 5: Commit**

```bash
rtk git add components/RoomWorkspace.tsx components/RoomWorkspace.test.tsx
rtk git commit -m "feat: add RoomWorkspace component for two-column furniture/item management"
```

---

### Task 5: 房間詳情頁改用 `RoomWorkspace`

**Files:**
- Modify: `app/rooms/[id]/page.tsx`

**Interfaces:**
- Consumes: `listItemsInRoom`(Task 2)、`RoomWorkspace`(Task 4)、`listCategories(): Promise<Category[]>`(`lib/db/libraries.ts`,已存在)、`groupItemNamesByCategoryId(): Promise<Record<number, string[]>>`(`lib/db/items.ts`,已存在)。

- [ ] **Step 1: 改寫 `app/rooms/[id]/page.tsx`**

將成個檔案內容換做:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoom } from "@/lib/db/rooms";
import { listFurnitureInRoom } from "@/lib/db/furniture";
import { getRoomItemSummary, listItemsInRoom, groupItemNamesByCategoryId } from "@/lib/db/items";
import { listCategories } from "@/lib/db/libraries";
import { RoomItemSummary } from "@/components/RoomItemSummary";
import { RoomWorkspace } from "@/components/RoomWorkspace";
import type { Item } from "@/lib/db/types";

export const dynamic = "force-dynamic";

function groupByFurnitureId(items: Item[]): Record<number, Item[]> {
  const grouped: Record<number, Item[]> = {};
  for (const item of items) {
    (grouped[item.furnitureId] ??= []).push(item);
  }
  return grouped;
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoom(Number(id));
  if (!room) notFound();

  const [furniture, itemSummary, items, categories, itemNamesByCategoryId] = await Promise.all([
    listFurnitureInRoom(room.id),
    getRoomItemSummary(room.id),
    listItemsInRoom(room.id),
    listCategories(),
    groupItemNamesByCategoryId(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-extrabold text-ink">{room.name}</h1>
          <p className="mt-1 text-sm font-sans text-ink-muted">
            {room.roomTypeLabel ?? "未分類"}
            {room.widthCm && room.lengthCm ? ` · ${room.widthCm} × ${room.lengthCm} cm` : ""}
          </p>
        </div>
        <Link href={`/rooms/${room.id}/edit`} className="text-sm font-caption text-ink-muted hover:underline">
          編輯房間
        </Link>
      </div>

      <RoomItemSummary items={itemSummary} />

      <RoomWorkspace
        roomId={room.id}
        furniture={furniture}
        itemsByFurnitureId={groupByFurnitureId(items)}
        categories={categories}
        itemNamesByCategoryId={itemNamesByCategoryId}
      />
    </div>
  );
}
```

- [ ] **Step 2: 跑成套測試**

Run: `npm test`
Expected: 全部測試 PASS(包括 Task 2、Task 4 新加嘅測試)。

- [ ] **Step 3: 用瀏覽器人手核對成個流程**

開 dev server(`npm run dev`),打開一個有傢俬同物品嘅房間(`/rooms/[id]`):
- 確認一入去中間已經顯示緊第一件傢俬嘅物品
- 撳右邊另一件傢俬,確認中間即時切換做嗰件嘅物品
- 喺中間新增一件物品,確認個新物品即刻出現,右邊嗰件傢俬嘅「N 件物品」數字都跟住加一
- 編輯/刪除中間某件物品,確認即刻反映
- 喺右邊新增一件新傢俬,確認右邊列表即刻多一件
- 刪除揀選緊嗰件傢俬,確認中間自動 fallback 去顯示第一件剩低嘅傢俬嘅物品
- 縮窄瀏覽器闊度到手機大小,確認變返直向堆疊,傢俬喺上、物品喺下

- [ ] **Step 4: Commit**

```bash
rtk git add "app/rooms/[id]/page.tsx"
rtk git commit -m "feat: wire RoomWorkspace into the room detail page"
```
