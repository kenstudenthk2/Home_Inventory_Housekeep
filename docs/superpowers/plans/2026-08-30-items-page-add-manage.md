# 「全部物品」新增 + 管理物品 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 喺 `/items`(全部物品)page 加「新增物品」掣同每行嘅管理操作(改數量、刪除、改位置),新增物品時可以揀「未定位置」延後決定實際擺放。

**Architecture:** 唔改 DB schema。用一個 find-or-create 出嚟嘅隱藏房間(`未分類`)+ 隱藏傢俬(`未定位置`)代表「未定位置」,`listRooms()` 過濾走呢個隱藏房間。新增一個可重用嘅 `LocationPicker` client component(房間→傢俬→櫃桶連鎖揀選 + 「未定位置」選項),喺新嘅 `QuickAddItemForm`(新增)同 `InventoryItemRow`/`InventoryItemTableRow`(管理)兩處用。伺服器動作層加一個 `resolveFurnitureId` helper 解析 `"unassigned"` sentinel,同一個新嘅 `updateItemLocationAction` 做搬位置。

**Tech Stack:** Next.js 16(App Router, server actions)、React 19、TypeScript、Supabase(`@supabase/supabase-js`)、Vitest + Testing Library(client component 測試喺 `jsdom` 環境;db 層測試打真實 dev Supabase)。

## Global Constraints

- 唔加任何 DB migration / schema 改動(spec 明確要求)
- 隱藏房間名稱固定為 `"未分類"`,隱藏傢俬名稱固定為 `"未定位置"`(spec:資料層設計)
- `listRooms()` 必須過濾走隱藏房間,唔可以出現喺 Sidebar / 房間清單 / 傢俬揀選器(spec:資料層設計)
- 管理操作範圍淨係:改數量、刪除、改位置 —— 唔加名稱/分類/到期日編輯(spec:組件設計 → `InventoryItemRow`)
- 全部 UI 文字用廣東話(口語書面),同現有 codebase 一致(例如「揀」、「櫃桶」、「櫃俬」等用字)
- 遵循現有 code style:server action 用 `"use server"` + `revalidatePath`;db 函數拋 `Error` 帶中文訊息;client component 用 controlled `useState` + hidden input 承載表單欄位(參考 `SearchableSelect.tsx`)

---

## Task 1: 隱藏「未分類」房間(data layer)

**Files:**
- Modify: `lib/db/rooms.ts`
- Test: `lib/db/rooms.test.ts`

**Interfaces:**
- Produces: `UNASSIGNED_ROOM_NAME: string`(常數,值 `"未分類"`)、`findOrCreateUnassignedRoom(): Promise<Room>`
- `listRooms()` 行為改變:回傳結果唔會再包含 `name === UNASSIGNED_ROOM_NAME` 嗰筆

- [ ] **Step 1: 寫失敗測試**

喺 `lib/db/rooms.test.ts` 頂部 import 加返 `findOrCreateUnassignedRoom` 同 `UNASSIGNED_ROOM_NAME`:

```ts
import {
  listRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  findOrCreateUnassignedRoom,
  UNASSIGNED_ROOM_NAME,
} from "./rooms";
```

喺檔案尾(`});` 之前嘅最後一個 `describe` 之後)加:

```ts
describe("findOrCreateUnassignedRoom", () => {
  it("creates the hidden room once and reuses it on later calls", async () => {
    const first = await findOrCreateUnassignedRoom();
    const second = await findOrCreateUnassignedRoom();
    expect(first.id).toBe(second.id);
    expect(first.name).toBe(UNASSIGNED_ROOM_NAME);
  });

  it("is excluded from listRooms", async () => {
    await findOrCreateUnassignedRoom();
    const names = (await listRooms()).map((r) => r.name);
    expect(names).not.toContain(UNASSIGNED_ROOM_NAME);
  });
});
```

- [ ] **Step 2: 行測試確認失敗**

Run: `npx vitest run lib/db/rooms.test.ts`
Expected: FAIL — `findOrCreateUnassignedRoom`/`UNASSIGNED_ROOM_NAME` 未定義

- [ ] **Step 3: 實作**

喺 `lib/db/rooms.ts`,`RoomInput` type 之後加常數:

```ts
export const UNASSIGNED_ROOM_NAME = "未分類";
```

喺 `deleteRoom` 之前(或者 `listRooms` 附近)加:

```ts
export async function findOrCreateUnassignedRoom(): Promise<Room> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(SELECT)
    .eq("name", UNASSIGNED_ROOM_NAME)
    .maybeSingle();
  if (error) throw new Error(`讀取未分類房間失敗:${error.message}`);
  if (data) return mapRoom(data as unknown as RoomRow);
  return createRoom({ name: UNASSIGNED_ROOM_NAME });
}
```

修改 `listRooms()`,喺 map 之前加 filter(過濾走隱藏房間):

```ts
export async function listRooms(): Promise<RoomSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(`${SELECT},furniture(id,items(id))`)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`讀取房間失敗:${error.message}`);

  return (data as unknown as (RoomRow & { furniture: { id: number; items: { id: number }[] }[] })[])
    .filter((row) => row.name !== UNASSIGNED_ROOM_NAME)
    .map((row) => ({
      ...mapRoom(row),
      furnitureCount: row.furniture.length,
      itemCount: row.furniture.reduce((sum, f) => sum + f.items.length, 0),
    }));
}
```

- [ ] **Step 4: 行測試確認通過**

Run: `npx vitest run lib/db/rooms.test.ts`
Expected: PASS(全部測試,包括新加嘅兩個)

- [ ] **Step 5: Commit**

```bash
git add lib/db/rooms.ts lib/db/rooms.test.ts
git commit -m "feat: add hidden unassigned room for items with no location yet"
```

---

## Task 2: 隱藏「未定位置」傢俬 + 全部傢俬平鋪查詢

**Files:**
- Modify: `lib/db/furniture.ts`
- Test: `lib/db/furniture.test.ts`

**Interfaces:**
- Consumes: `findOrCreateUnassignedRoom()`、`Room` from `./rooms`(Task 1)
- Produces: `UNASSIGNED_FURNITURE_NAME: string`(值 `"未定位置"`)、`findOrCreateUnassignedFurniture(): Promise<Furniture>`、`listAllFurniture(): Promise<Furniture[]>`

- [ ] **Step 1: 寫失敗測試**

喺 `lib/db/furniture.test.ts` import 加:

```ts
import {
  listFurnitureInRoom,
  getFurniture,
  addFurnitureToRoom,
  addFurnitureByName,
  deleteFurniture,
  findOrCreateUnassignedFurniture,
  listAllFurniture,
  UNASSIGNED_FURNITURE_NAME,
} from "./furniture";
```

檔案尾加:

```ts
describe("findOrCreateUnassignedFurniture", () => {
  it("creates the hidden furniture once and reuses it on later calls", async () => {
    const first = await findOrCreateUnassignedFurniture();
    const second = await findOrCreateUnassignedFurniture();
    expect(first.id).toBe(second.id);
    expect(first.displayName).toBe(UNASSIGNED_FURNITURE_NAME);
  });
});

describe("listAllFurniture", () => {
  it("includes furniture from every room, not just one", async () => {
    const all = await listAllFurniture();
    expect(all.some((f) => f.roomId === roomId)).toBe(true);
  });
});
```

- [ ] **Step 2: 行測試確認失敗**

Run: `npx vitest run lib/db/furniture.test.ts`
Expected: FAIL — `findOrCreateUnassignedFurniture`/`listAllFurniture`/`UNASSIGNED_FURNITURE_NAME` 未定義

- [ ] **Step 3: 實作**

喺 `lib/db/furniture.ts` 頂部加 import:

```ts
import { findOrCreateUnassignedRoom } from "./rooms";
```

加常數(擺喺 import 之後):

```ts
export const UNASSIGNED_FURNITURE_NAME = "未定位置";
```

加兩個函數(擺喺 `deleteFurniture` 之前):

```ts
export async function listAllFurniture(): Promise<Furniture[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("furniture")
    .select(SELECT)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`讀取傢俬失敗:${error.message}`);
  return (data as unknown as FurnitureRow[]).map(mapFurniture);
}

export async function findOrCreateUnassignedFurniture(): Promise<Furniture> {
  const room = await findOrCreateUnassignedRoom();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("furniture")
    .select(SELECT)
    .eq("room_id", room.id)
    .maybeSingle();
  if (error) throw new Error(`讀取未定位置傢俬失敗:${error.message}`);
  if (data) return mapFurniture(data as unknown as FurnitureRow);
  return addFurnitureByName(room.id, UNASSIGNED_FURNITURE_NAME, "box");
}
```

- [ ] **Step 4: 行測試確認通過**

Run: `npx vitest run lib/db/furniture.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db/furniture.ts lib/db/furniture.test.ts
git commit -m "feat: add hidden unassigned furniture and a flat all-furniture query"
```

---

## Task 3: 全部櫃桶平鋪查詢

**Files:**
- Modify: `lib/db/drawers.ts`
- Test: `lib/db/drawers.test.ts`

**Interfaces:**
- Produces: `listAllDrawers(): Promise<Drawer[]>`

- [ ] **Step 1: 寫失敗測試**

喺 `lib/db/drawers.test.ts` import 加 `listAllDrawers`:

```ts
import { listDrawersForFurniture, addDrawer, renameDrawer, deleteDrawer, listAllDrawers } from "./drawers";
```

檔案尾(`describe("drawers", ...)` 嗰個 block 入面最後一個 `it` 之後)加:

```ts
it("lists every drawer across all furniture pieces", async () => {
  const drawer = await addDrawer(furnitureId, `平鋪測試格-${Date.now()}`);
  const all = await listAllDrawers();
  expect(all.map((d) => d.id)).toContain(drawer.id);
});
```

- [ ] **Step 2: 行測試確認失敗**

Run: `npx vitest run lib/db/drawers.test.ts`
Expected: FAIL — `listAllDrawers` 未定義

- [ ] **Step 3: 實作**

喺 `lib/db/drawers.ts`,`listDrawersInRoom` 之後加:

```ts
export async function listAllDrawers(): Promise<Drawer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("drawers")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`讀取櫃桶失敗:${error.message}`);
  return (data as unknown as DrawerRow[]).map(mapDrawer);
}
```

- [ ] **Step 4: 行測試確認通過**

Run: `npx vitest run lib/db/drawers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db/drawers.ts lib/db/drawers.test.ts
git commit -m "feat: add flat all-drawers query"
```

---

## Task 4: 搬移物品位置(`moveItemLocation`)

**Files:**
- Modify: `lib/db/items.ts`
- Test: `lib/db/items.test.ts`

**Interfaces:**
- Produces: `moveItemLocation(id: number, furnitureId: number, drawerId?: number | null): Promise<Item>`
- 沿用檔案入面已有嘅私有函數 `resolveDrawerId(furnitureId, drawerId)` 做驗證(傢俬有櫃桶但冇揀就拋錯)

- [ ] **Step 1: 寫失敗測試**

喺 `lib/db/items.test.ts` import 加 `moveItemLocation`:

```ts
import {
  listItemsInFurniture,
  listItemsInRoom,
  createItem,
  updateItem,
  moveItemLocation,
  deleteItem,
} from "./items";
```

喺 `describe("items", ...)` block 入面(例如喺 `"deletes an item"` 個 test 之後)加:

```ts
it("moves an item to another furniture piece with no drawers", async () => {
  const otherFurnitureId = (await addFurnitureByName(roomId, `搬移目標櫃-${Date.now()}`)).id;
  const item = await createItem({ furnitureId, name: "待搬移" });

  const moved = await moveItemLocation(item.id, otherFurnitureId, null);
  expect(moved.furnitureId).toBe(otherFurnitureId);
  expect(moved.drawerId).toBeNull();
});

it("requires a drawer when moving into furniture that has one", async () => {
  const drawerRoomId = (await createRoom({ name: `搬移有格房-${Date.now()}` })).id;
  const drawerFurnitureId = (await addFurnitureByName(drawerRoomId, `搬移有格櫃-${Date.now()}`)).id;
  await addDrawer(drawerFurnitureId, "第一格");
  const item = await createItem({ furnitureId, name: "待搬移二" });

  await expect(moveItemLocation(item.id, drawerFurnitureId, null)).rejects.toThrow(/櫃桶/);

  await deleteRoom(drawerRoomId);
});
```

- [ ] **Step 2: 行測試確認失敗**

Run: `npx vitest run lib/db/items.test.ts`
Expected: FAIL — `moveItemLocation` 未定義

- [ ] **Step 3: 實作**

喺 `lib/db/items.ts`,`updateItem` 之後加:

```ts
export async function moveItemLocation(
  id: number,
  furnitureId: number,
  drawerId?: number | null,
): Promise<Item> {
  const payload = {
    furniture_id: furnitureId,
    drawer_id: await resolveDrawerId(furnitureId, drawerId),
  };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .update(payload)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(`搬移物品失敗:${error.message}`);
  return mapItem(data as unknown as ItemRow);
}
```

- [ ] **Step 4: 行測試確認通過**

Run: `npx vitest run lib/db/items.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db/items.ts lib/db/items.test.ts
git commit -m "feat: add moveItemLocation to relocate an item between furniture pieces"
```

---

## Task 5: `listInventory` 帶埋櫃桶資訊

**Files:**
- Modify: `lib/db/inventory.ts`
- Test: `lib/db/inventory.test.ts`

**Interfaces:**
- Produces: `InventoryRow` type 新增 `drawerId: number | null` 同 `drawerName: string | null` 兩個欄位

- [ ] **Step 1: 寫失敗測試**

喺 `lib/db/inventory.test.ts` import 加 `addDrawer`:

```ts
import { createRoom, deleteRoom } from "./rooms";
import { addFurnitureByName } from "./furniture";
import { addDrawer } from "./drawers";
import { createItem } from "./items";
import { listInventory, listExpiringItems, expiryStatusOf } from "./inventory";
```

喺 `describe("listInventory", ...)` block 最後一個 `it` 之後加:

```ts
it("carries the drawer name when an item is scoped to one", async () => {
  const drawerRoomId = (await createRoom({ name: `清單抽屜房-${stamp}` })).id;
  const drawerFurnitureId = (await addFurnitureByName(drawerRoomId, `清單抽屜櫃-${stamp}`)).id;
  const drawer = await addDrawer(drawerFurnitureId, "抽屜A");
  await createItem({ furnitureId: drawerFurnitureId, drawerId: drawer.id, name: `抽屜物品-${stamp}` });

  const rows = await listInventory({ roomId: drawerRoomId });
  expect(rows[0].drawerId).toBe(drawer.id);
  expect(rows[0].drawerName).toBe("抽屜A");

  await deleteRoom(drawerRoomId);
});

it("has null drawer info for items directly on furniture", async () => {
  const rows = await listInventory({ roomId, furnitureId });
  expect(rows.every((r) => r.drawerId === null && r.drawerName === null)).toBe(true);
});
```

- [ ] **Step 2: 行測試確認失敗**

Run: `npx vitest run lib/db/inventory.test.ts`
Expected: FAIL — `rows[0].drawerId`/`drawerName` 係 `undefined`,同期望值唔一致

- [ ] **Step 3: 實作**

喺 `lib/db/inventory.ts`,`InventoryRow` type 加兩個欄位:

```ts
export type InventoryRow = {
  itemId: number;
  itemName: string;
  quantity: number;
  expiryDate: string | null;
  categoryId: number | null;
  categoryName: string | null;
  drawerId: number | null;
  drawerName: string | null;
  furnitureId: number;
  furnitureName: string;
  roomId: number;
  roomName: string;
};
```

`Row` type 加欄位:

```ts
type Row = {
  id: number;
  name: string;
  quantity: number;
  expiry_date: string | null;
  category_id: number | null;
  categories: { name: string } | null;
  drawer_id: number | null;
  drawers: { name: string } | null;
  furniture: {
    id: number;
    custom_name: string | null;
    furniture_types: { name: string } | null;
    rooms: { id: number; name: string } | null;
  } | null;
};
```

`SELECT` 加返 `drawer_id,drawers(name)`:

```ts
const SELECT = `
  id,name,quantity,expiry_date,category_id,drawer_id,
  categories(name),
  drawers(name),
  furniture!inner(id,custom_name,furniture_types(name),rooms!inner(id,name))
`;
```

`mapRow` 加兩行:

```ts
function mapRow(row: Row): InventoryRow {
  return {
    itemId: row.id,
    itemName: row.name,
    quantity: row.quantity,
    expiryDate: row.expiry_date,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    drawerId: row.drawer_id,
    drawerName: row.drawers?.name ?? null,
    furnitureId: row.furniture?.id ?? 0,
    furnitureName:
      row.furniture?.custom_name ?? row.furniture?.furniture_types?.name ?? "未命名傢俬",
    roomId: row.furniture?.rooms?.id ?? 0,
    roomName: row.furniture?.rooms?.name ?? "",
  };
}
```

- [ ] **Step 4: 行測試確認通過**

Run: `npx vitest run lib/db/inventory.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db/inventory.ts lib/db/inventory.test.ts
git commit -m "feat: carry drawer id/name on inventory rows"
```

---

## Task 6: Server actions —「未定位置」解析 + 搬位置動作

**Files:**
- Modify: `app/actions/items.ts`

**Interfaces:**
- Consumes: `findOrCreateUnassignedFurniture()`(Task 2)、`moveItemLocation()`(Task 4)
- Produces: `updateItemLocationAction(formData: FormData): Promise<void>`(新 server action);`createItemAction` 而家接受 `furnitureId` 欄位值為 `"unassigned"`

呢個 task 冇獨立自動化測試(呢個 codebase 冇 server action 嘅單元測試慣例,`app/actions/*.ts` 一直靠 `lib/db/*.test.ts` 嘅覆蓋 + 手動瀏覽器驗證)。Task 4 已經測試咗 `moveItemLocation` 本身嘅邏輯;呢步淨係接線。

- [ ] **Step 1: 改寫成個檔案**

將 `app/actions/items.ts` 成個內容換做:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createItem, updateItem, deleteItem, moveItemLocation } from "@/lib/db/items";
import { getFurniture, findOrCreateUnassignedFurniture } from "@/lib/db/furniture";
import { optionalNumber, optionalText, requiredNumber, requiredText } from "@/lib/form";

function categoryFrom(formData: FormData) {
  return {
    categoryId: optionalNumber(formData, "categoryId"),
    categoryName: optionalText(formData, "categoryName"),
  };
}

/** LocationPicker 揀「未定位置」嗰陣,`furnitureId` 欄位會係字串 "unassigned" 而唔係數字。 */
async function resolveFurnitureId(formData: FormData): Promise<number> {
  if (formData.get("furnitureId") === "unassigned") {
    return (await findOrCreateUnassignedFurniture()).id;
  }
  return requiredNumber(formData, "furnitureId");
}

export async function createItemAction(formData: FormData) {
  const furnitureId = await resolveFurnitureId(formData);
  const furniture = await getFurniture(furnitureId);
  await createItem({
    furnitureId,
    drawerId: optionalNumber(formData, "drawerId"),
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

export async function updateItemAction(formData: FormData) {
  const id = requiredNumber(formData, "id");
  const furnitureId = requiredNumber(formData, "furnitureId");
  const furniture = await getFurniture(furnitureId);
  await updateItem(id, furnitureId, {
    drawerId: optionalNumber(formData, "drawerId"),
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

export async function updateItemLocationAction(formData: FormData) {
  const id = requiredNumber(formData, "id");
  const previousFurnitureId = requiredNumber(formData, "currentFurnitureId");
  const newFurnitureId = await resolveFurnitureId(formData);

  await moveItemLocation(id, newFurnitureId, optionalNumber(formData, "drawerId"));

  const [previousFurniture, newFurniture] = await Promise.all([
    getFurniture(previousFurnitureId),
    getFurniture(newFurnitureId),
  ]);

  revalidatePath(`/furniture/${previousFurnitureId}`);
  revalidatePath(`/furniture/${newFurnitureId}`);
  if (previousFurniture) revalidatePath(`/rooms/${previousFurniture.roomId}`);
  if (newFurniture) revalidatePath(`/rooms/${newFurniture.roomId}`);
  revalidatePath("/items");
  revalidatePath("/");
}

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

- [ ] **Step 2: 全套測試回歸**

Run: `npx vitest run`
Expected: PASS(呢步唔會新增測試,淨係確認冇打斷任何現有測試,尤其 `RoomWorkspace.test.tsx` 用嘅 `createItemAction` 冇被呢個改動影響)

- [ ] **Step 3: Commit**

```bash
git add app/actions/items.ts
git commit -m "feat: resolve unassigned-location sentinel and add updateItemLocationAction"
```

---

## Task 7: `LocationPicker` 組件

**Files:**
- Create: `components/LocationPicker.tsx`
- Test: `components/LocationPicker.test.tsx`

**Interfaces:**
- Consumes: `RoomSummary` from `@/lib/db/rooms`、`Furniture`/`Drawer` from `@/lib/db/types`
- Produces: `LocationPicker` component、`UNASSIGNED_LOCATION_VALUE: string`(值 `"unassigned"`)。喺任何 `<form>` 入面輸出兩個表單欄位:`furnitureId`(數值字串或 `"unassigned"`)、`drawerId`(數值字串或空字串)

- [ ] **Step 1: 寫失敗測試**

建立 `components/LocationPicker.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationPicker, UNASSIGNED_LOCATION_VALUE } from "./LocationPicker";
import type { RoomSummary } from "@/lib/db/rooms";
import type { Furniture, Drawer } from "@/lib/db/types";

afterEach(cleanup);

const ROOMS: RoomSummary[] = [
  { id: 1, name: "睡房", roomTypeId: null, roomTypeLabel: null, widthCm: null, lengthCm: null, furnitureCount: 0, itemCount: 0 },
  { id: 2, name: "廚房", roomTypeId: null, roomTypeLabel: null, widthCm: null, lengthCm: null, furnitureCount: 0, itemCount: 0 },
];

const FURNITURE: Furniture[] = [
  { id: 10, roomId: 1, furnitureTypeId: 1, customName: null, displayName: "衣櫃", iconKey: "box" },
  { id: 20, roomId: 2, furnitureTypeId: 2, customName: null, displayName: "雪櫃", iconKey: "box" },
];

const DRAWERS: Drawer[] = [{ id: 100, furnitureId: 10, name: "上格", sortOrder: 0 }];

function hidden(name: string) {
  return document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`);
}

describe("LocationPicker", () => {
  it("shows only furniture belonging to the chosen room", async () => {
    const user = userEvent.setup();
    render(<LocationPicker rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} idPrefix="test" />);

    await user.selectOptions(screen.getByLabelText("房間"), "1");
    expect(screen.getByRole("option", { name: "衣櫃" })).toBeDefined();
    expect(screen.queryByRole("option", { name: "雪櫃" })).toBeNull();
  });

  it("reveals the drawer select once a furniture piece with drawers is chosen", async () => {
    const user = userEvent.setup();
    render(<LocationPicker rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} idPrefix="test" />);

    await user.selectOptions(screen.getByLabelText("房間"), "1");
    await user.selectOptions(screen.getByLabelText("傢俬"), "10");
    expect(screen.getByLabelText("櫃桶")).toBeDefined();

    await user.selectOptions(screen.getByLabelText("櫃桶"), "100");
    expect(hidden("drawerId")!.value).toBe("100");
  });

  it("hides furniture/drawer selects and submits the unassigned sentinel", async () => {
    const user = userEvent.setup();
    render(<LocationPicker rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} idPrefix="test" />);

    await user.selectOptions(screen.getByLabelText("房間"), UNASSIGNED_LOCATION_VALUE);
    expect(screen.queryByLabelText("傢俬")).toBeNull();
    expect(hidden("furnitureId")!.value).toBe(UNASSIGNED_LOCATION_VALUE);
  });

  it("preselects the room and furniture that already own the given furniture id", () => {
    render(
      <LocationPicker
        rooms={ROOMS}
        furniture={FURNITURE}
        drawers={DRAWERS}
        defaultFurnitureId={20}
        idPrefix="test"
      />,
    );

    expect((screen.getByLabelText("房間") as HTMLSelectElement).value).toBe("2");
    expect(hidden("furnitureId")!.value).toBe("20");
  });
});
```

- [ ] **Step 2: 行測試確認失敗**

Run: `npx vitest run components/LocationPicker.test.tsx`
Expected: FAIL — 搵唔到 `./LocationPicker` 模組

- [ ] **Step 3: 實作**

建立 `components/LocationPicker.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Drawer, Furniture } from "@/lib/db/types";
import type { RoomSummary } from "@/lib/db/rooms";

export const UNASSIGNED_LOCATION_VALUE = "unassigned";

export function LocationPicker({
  rooms,
  furniture,
  drawers,
  defaultFurnitureId,
  defaultDrawerId,
  idPrefix,
}: {
  rooms: RoomSummary[];
  furniture: Furniture[];
  drawers: Drawer[];
  /** 預選畀擁有呢個 furniture id 嘅房間/傢俬(例如編輯現有物品嘅位置)。 */
  defaultFurnitureId?: number | null;
  defaultDrawerId?: number | null;
  /** 畀呢個 picker 嘅 element id 加前綴,等一版頁面可以放幾個實例。 */
  idPrefix: string;
}) {
  const defaultFurniture = furniture.find((f) => f.id === defaultFurnitureId) ?? null;
  const defaultRoomKnown = defaultFurniture !== null && rooms.some((r) => r.id === defaultFurniture.roomId);

  const [roomValue, setRoomValue] = useState<string>(
    defaultRoomKnown
      ? String(defaultFurniture!.roomId)
      : defaultFurnitureId != null
        ? UNASSIGNED_LOCATION_VALUE
        : "",
  );
  const [furnitureId, setFurnitureId] = useState<number | null>(defaultFurniture?.id ?? null);
  const [drawerId, setDrawerId] = useState<number | null>(defaultDrawerId ?? null);

  const isUnassigned = roomValue === UNASSIGNED_LOCATION_VALUE;
  const roomChosen = roomValue !== "" && !isUnassigned;

  const furnitureInRoom = useMemo(
    () => (roomChosen ? furniture.filter((f) => f.roomId === Number(roomValue)) : []),
    [furniture, roomValue, roomChosen],
  );
  const drawersInFurniture = useMemo(
    () => (furnitureId === null ? [] : drawers.filter((d) => d.furnitureId === furnitureId)),
    [drawers, furnitureId],
  );

  function handleRoomChange(value: string) {
    setRoomValue(value);
    setFurnitureId(null);
    setDrawerId(null);
  }

  function handleFurnitureChange(value: string) {
    setFurnitureId(value === "" ? null : Number(value));
    setDrawerId(null);
  }

  const showDrawerSelect = roomChosen && drawersInFurniture.length > 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={`${idPrefix}-room`} className="text-sm font-caption font-medium text-ink-muted">
          房間
        </label>
        <select
          id={`${idPrefix}-room`}
          required
          value={roomValue}
          onChange={(e) => handleRoomChange(e.target.value)}
          className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
        >
          <option value="" disabled>
            揀房間…
          </option>
          <option value={UNASSIGNED_LOCATION_VALUE}>未定位置</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {roomChosen && (
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={`${idPrefix}-furniture`} className="text-sm font-caption font-medium text-ink-muted">
            傢俬
          </label>
          <select
            id={`${idPrefix}-furniture`}
            required
            value={furnitureId ?? ""}
            onChange={(e) => handleFurnitureChange(e.target.value)}
            className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          >
            <option value="" disabled>
              揀一件傢俬…
            </option>
            {furnitureInRoom.map((f) => (
              <option key={f.id} value={f.id}>
                {f.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {showDrawerSelect && (
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={`${idPrefix}-drawer`} className="text-sm font-caption font-medium text-ink-muted">
            櫃桶
          </label>
          <select
            id={`${idPrefix}-drawer`}
            name="drawerId"
            required
            value={drawerId ?? ""}
            onChange={(e) => setDrawerId(e.target.value === "" ? null : Number(e.target.value))}
            className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          >
            <option value="" disabled>
              揀一個櫃桶…
            </option>
            {drawersInFurniture.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <input
        type="hidden"
        name="furnitureId"
        value={isUnassigned ? UNASSIGNED_LOCATION_VALUE : (furnitureId ?? "")}
      />
      {!showDrawerSelect && <input type="hidden" name="drawerId" value={drawerId ?? ""} />}
    </div>
  );
}
```

- [ ] **Step 4: 行測試確認通過**

Run: `npx vitest run components/LocationPicker.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/LocationPicker.tsx components/LocationPicker.test.tsx
git commit -m "feat: add LocationPicker cascading room/furniture/drawer selector"
```

---

## Task 8: `QuickAddItemForm`(頁面頂新增物品表單)

**Files:**
- Modify: `components/ItemForm.tsx`(將 `ItemNameComboBox` export 出嚟畀重用)
- Create: `components/QuickAddItemForm.tsx`
- Test: `components/QuickAddItemForm.test.tsx`

**Interfaces:**
- Consumes: `LocationPicker`(Task 7)、`ItemNameComboBox`(由呢個 task export)、`SearchableSelect`、`createItemAction`
- Produces: `QuickAddItemForm` component,props `{ rooms, furniture, drawers, categories, itemNamesByCategoryId, onDone }`,`onDone: () => void` 喺表單成功 submit 之後被 call(等父組件收埋個表單)

- [ ] **Step 1: Export `ItemNameComboBox`**

喺 `components/ItemForm.tsx`,將 `function ItemNameComboBox(` 改做 `export function ItemNameComboBox(`(呢個組件而家已經有齊需要嘅 props:`suggestions`、`defaultValue`、`inputId`,唔使再改佢嘅內容)。

- [ ] **Step 2: 寫失敗測試**

建立 `components/QuickAddItemForm.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickAddItemForm } from "./QuickAddItemForm";
import type { RoomSummary } from "@/lib/db/rooms";
import type { Furniture, Drawer } from "@/lib/db/types";

afterEach(cleanup);

const ROOMS: RoomSummary[] = [
  { id: 1, name: "睡房", roomTypeId: null, roomTypeLabel: null, widthCm: null, lengthCm: null, furnitureCount: 0, itemCount: 0 },
];
const FURNITURE: Furniture[] = [
  { id: 10, roomId: 1, furnitureTypeId: 1, customName: null, displayName: "衣櫃", iconKey: "box" },
];
const DRAWERS: Drawer[] = [];

describe("QuickAddItemForm", () => {
  it("renders the location picker and item fields", () => {
    render(
      <QuickAddItemForm
        rooms={ROOMS}
        furniture={FURNITURE}
        drawers={DRAWERS}
        categories={[]}
        itemNamesByCategoryId={{}}
        onDone={() => {}}
      />,
    );

    expect(screen.getByLabelText("房間")).toBeDefined();
    expect(screen.getByLabelText("物品名稱")).toBeDefined();
    expect(screen.getByLabelText("數量")).toBeDefined();
  });

  it("calls onDone when cancelled without submitting", async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(
      <QuickAddItemForm
        rooms={ROOMS}
        furniture={FURNITURE}
        drawers={DRAWERS}
        categories={[]}
        itemNamesByCategoryId={{}}
        onDone={onDone}
      />,
    );

    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 3: 行測試確認失敗**

Run: `npx vitest run components/QuickAddItemForm.test.tsx`
Expected: FAIL — 搵唔到 `./QuickAddItemForm` 模組

- [ ] **Step 4: 實作**

建立 `components/QuickAddItemForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ItemNameComboBox } from "./ItemForm";
import { LocationPicker } from "./LocationPicker";
import { SearchableSelect } from "./SearchableSelect";
import { SubmitButton } from "./SubmitButton";
import { createItemAction } from "@/app/actions/items";
import type { Category, Drawer, Furniture } from "@/lib/db/types";
import type { RoomSummary } from "@/lib/db/rooms";

export function QuickAddItemForm({
  rooms,
  furniture,
  drawers,
  categories,
  itemNamesByCategoryId,
  onDone,
}: {
  rooms: RoomSummary[];
  furniture: Furniture[];
  drawers: Drawer[];
  categories: Category[];
  itemNamesByCategoryId: Record<number, string[]>;
  onDone: () => void;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  async function handleSubmit(formData: FormData) {
    await createItemAction(formData);
    onDone();
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <LocationPicker rooms={rooms} furniture={furniture} drawers={drawers} idPrefix="quick-add" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchableSelect
            name="category"
            label="分類(選填)"
            placeholder="輸入或揀一個分類…"
            allowCreate
            options={categories.map((c) => ({ id: c.id, label: c.name }))}
            onSelectChange={setSelectedCategoryId}
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="quick-add-name" className="text-sm font-caption font-medium text-ink-muted">
            物品名稱
          </label>
          {selectedCategoryId != null ? (
            <ItemNameComboBox
              inputId="quick-add-name"
              defaultValue=""
              suggestions={itemNamesByCategoryId[selectedCategoryId] ?? []}
            />
          ) : (
            <input
              id="quick-add-name"
              name="name"
              required
              placeholder="例如:AA 電芯"
              className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-col gap-1">
          <label htmlFor="quick-add-quantity" className="text-sm font-caption font-medium text-ink-muted">
            數量
          </label>
          <input
            id="quick-add-quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            defaultValue={1}
            className="w-full rounded-sm border border-border-input px-3 py-2 text-base sm:w-24 sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="quick-add-expiry" className="text-sm font-caption font-medium text-ink-muted">
            到期日(選填)
          </label>
          <input
            id="quick-add-expiry"
            name="expiryDate"
            type="date"
            className="w-full rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <SubmitButton
          className="h-11 flex-1 rounded-sm bg-accent px-4 text-sm font-caption font-semibold text-white hover:bg-accent-light"
          pendingChildren="新增緊…"
        >
          新增物品
        </SubmitButton>
        <button
          type="button"
          onClick={onDone}
          className="h-11 rounded-sm border border-border px-4 text-sm font-caption text-ink-muted hover:bg-surface-mist"
        >
          取消
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: 行測試確認通過**

Run: `npx vitest run components/QuickAddItemForm.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/ItemForm.tsx components/QuickAddItemForm.tsx components/QuickAddItemForm.test.tsx
git commit -m "feat: add QuickAddItemForm with location picker for the items page"
```

---

## Task 9: `AddItemToggle`(撳掣展開/收埋新增表單)

**Files:**
- Create: `components/AddItemToggle.tsx`
- Test: `components/AddItemToggle.test.tsx`

**Interfaces:**
- Consumes: `QuickAddItemForm`(Task 8)
- Produces: `AddItemToggle` component,props `{ rooms, furniture, drawers, categories, itemNamesByCategoryId }`(同 `QuickAddItemForm` 一樣,少咗 `onDone` —— 呢個組件自己管理開關 state)

- [ ] **Step 1: 寫失敗測試**

建立 `components/AddItemToggle.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddItemToggle } from "./AddItemToggle";

afterEach(cleanup);

describe("AddItemToggle", () => {
  it("shows the add-item button by default, and the form after clicking it", async () => {
    const user = userEvent.setup();
    render(<AddItemToggle rooms={[]} furniture={[]} drawers={[]} categories={[]} itemNamesByCategoryId={{}} />);

    expect(screen.queryByLabelText("房間")).toBeNull();

    await user.click(screen.getByRole("button", { name: "新增物品" }));
    expect(screen.getByLabelText("房間")).toBeDefined();
  });

  it("collapses back to the button when the form is cancelled", async () => {
    const user = userEvent.setup();
    render(<AddItemToggle rooms={[]} furniture={[]} drawers={[]} categories={[]} itemNamesByCategoryId={{}} />);

    await user.click(screen.getByRole("button", { name: "新增物品" }));
    await user.click(screen.getByRole("button", { name: "取消" }));

    expect(screen.getByRole("button", { name: "新增物品" })).toBeDefined();
    expect(screen.queryByLabelText("房間")).toBeNull();
  });
});
```

- [ ] **Step 2: 行測試確認失敗**

Run: `npx vitest run components/AddItemToggle.test.tsx`
Expected: FAIL — 搵唔到 `./AddItemToggle` 模組

- [ ] **Step 3: 實作**

建立 `components/AddItemToggle.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { QuickAddItemForm } from "./QuickAddItemForm";
import type { Category, Drawer, Furniture } from "@/lib/db/types";
import type { RoomSummary } from "@/lib/db/rooms";

export function AddItemToggle({
  rooms,
  furniture,
  drawers,
  categories,
  itemNamesByCategoryId,
}: {
  rooms: RoomSummary[];
  furniture: Furniture[];
  drawers: Drawer[];
  categories: Category[];
  itemNamesByCategoryId: Record<number, string[]>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) {
    return (
      <QuickAddItemForm
        rooms={rooms}
        furniture={furniture}
        drawers={drawers}
        categories={categories}
        itemNamesByCategoryId={itemNamesByCategoryId}
        onDone={() => setIsOpen(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="inline-flex h-11 items-center justify-center gap-1 self-start rounded-sm bg-accent px-4 text-sm font-caption font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-accent-light active:scale-[0.97] motion-reduce:transition-none"
    >
      <Plus className="h-4 w-4" aria-hidden />
      新增物品
    </button>
  );
}
```

- [ ] **Step 4: 行測試確認通過**

Run: `npx vitest run components/AddItemToggle.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/AddItemToggle.tsx components/AddItemToggle.test.tsx
git commit -m "feat: add AddItemToggle button that expands the quick-add form"
```

---

## Task 10: `InventoryItemRow` / `InventoryItemTableRow`(管理:改數量、刪除、改位置)

**Files:**
- Create: `components/InventoryItemRow.tsx`
- Test: `components/InventoryItemRow.test.tsx`

**Interfaces:**
- Consumes: `LocationPicker`(Task 7)、`updateItemAction`/`deleteItemAction`/`updateItemLocationAction`(Task 6)、`InventoryRow` type from `@/lib/db/inventory`(Task 5)
- Produces: `InventoryItemRow`(mobile `<li>` 卡片)同 `InventoryItemTableRow`(desktop `<tr>`)兩個 component,props 都係 `{ row: InventoryRow, rooms: RoomSummary[], furniture: Furniture[], drawers: Drawer[] }`

- [ ] **Step 1: 寫失敗測試**

建立 `components/InventoryItemRow.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InventoryItemRow } from "./InventoryItemRow";
import type { InventoryRow } from "@/lib/db/inventory";
import type { RoomSummary } from "@/lib/db/rooms";
import type { Furniture, Drawer } from "@/lib/db/types";

afterEach(cleanup);

const ROOMS: RoomSummary[] = [
  { id: 1, name: "睡房", roomTypeId: null, roomTypeLabel: null, widthCm: null, lengthCm: null, furnitureCount: 0, itemCount: 0 },
  { id: 2, name: "廚房", roomTypeId: null, roomTypeLabel: null, widthCm: null, lengthCm: null, furnitureCount: 0, itemCount: 0 },
];
const FURNITURE: Furniture[] = [
  { id: 10, roomId: 1, furnitureTypeId: 1, customName: null, displayName: "衣櫃", iconKey: "box" },
  { id: 20, roomId: 2, furnitureTypeId: 2, customName: null, displayName: "雪櫃", iconKey: "box" },
];
const DRAWERS: Drawer[] = [];

const ROW: InventoryRow = {
  itemId: 1,
  itemName: "電芯",
  quantity: 4,
  expiryDate: null,
  categoryId: null,
  categoryName: null,
  drawerId: null,
  drawerName: null,
  furnitureId: 10,
  furnitureName: "衣櫃",
  roomId: 1,
  roomName: "睡房",
};

describe("InventoryItemRow", () => {
  it("shows the current location as a label, not an editor, by default", () => {
    render(<InventoryItemRow row={ROW} rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} />);
    expect(screen.getByText("睡房 · 衣櫃")).toBeDefined();
    expect(screen.queryByLabelText("房間")).toBeNull();
  });

  it("opens the location picker preset to the current room/furniture when clicked", async () => {
    const user = userEvent.setup();
    render(<InventoryItemRow row={ROW} rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} />);

    await user.click(screen.getByText("睡房 · 衣櫃"));

    expect((screen.getByLabelText("房間") as HTMLSelectElement).value).toBe("1");
  });

  it("switches the quantity display into an editable input when clicked", async () => {
    const user = userEvent.setup();
    render(<InventoryItemRow row={ROW} rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} />);

    await user.click(screen.getByLabelText("編輯電芯數量"));
    expect(screen.getByDisplayValue("4")).toBeDefined();
  });
});
```

- [ ] **Step 2: 行測試確認失敗**

Run: `npx vitest run components/InventoryItemRow.test.tsx`
Expected: FAIL — 搵唔到 `./InventoryItemRow` 模組

- [ ] **Step 3: 實作**

建立 `components/InventoryItemRow.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ExpiryBadge } from "./ExpiryBadge";
import { SubmitButton } from "./SubmitButton";
import { LocationPicker } from "./LocationPicker";
import { deleteItemAction, updateItemAction, updateItemLocationAction } from "@/app/actions/items";
import type { Drawer, Furniture } from "@/lib/db/types";
import type { RoomSummary } from "@/lib/db/rooms";
import type { InventoryRow } from "@/lib/db/inventory";

type RowProps = {
  row: InventoryRow;
  rooms: RoomSummary[];
  furniture: Furniture[];
  drawers: Drawer[];
};

function QuantityEditor({ row, onDone }: { row: InventoryRow; onDone: () => void }) {
  async function handleSave(formData: FormData) {
    await updateItemAction(formData);
    onDone();
  }

  return (
    <form action={handleSave} className="flex items-center gap-1">
      <input type="hidden" name="id" value={row.itemId} />
      <input type="hidden" name="furnitureId" value={row.furnitureId} />
      <input type="hidden" name="name" value={row.itemName} />
      {row.drawerId != null && <input type="hidden" name="drawerId" value={row.drawerId} />}
      {row.categoryId != null && <input type="hidden" name="categoryId" value={row.categoryId} />}
      {row.expiryDate && <input type="hidden" name="expiryDate" value={row.expiryDate} />}
      <input
        type="number"
        name="quantity"
        min="1"
        step="1"
        defaultValue={row.quantity}
        autoFocus
        className="w-16 rounded-sm border border-border-input px-2 py-1 text-sm"
      />
      <SubmitButton className="text-xs font-caption text-accent hover:underline" pendingChildren="儲存緊…">
        儲存
      </SubmitButton>
      <button type="button" onClick={onDone} className="text-xs font-caption text-ink-muted hover:underline">
        取消
      </button>
    </form>
  );
}

function LocationEditor({ row, rooms, furniture, drawers, onDone }: RowProps & { onDone: () => void }) {
  async function handleSave(formData: FormData) {
    await updateItemLocationAction(formData);
    onDone();
  }

  return (
    <form action={handleSave} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="id" value={row.itemId} />
      <input type="hidden" name="currentFurnitureId" value={row.furnitureId} />
      <LocationPicker
        rooms={rooms}
        furniture={furniture}
        drawers={drawers}
        defaultFurnitureId={row.furnitureId}
        defaultDrawerId={row.drawerId}
        idPrefix={`item-${row.itemId}-location`}
      />
      <div className="flex gap-2">
        <SubmitButton className="text-xs font-caption text-accent hover:underline" pendingChildren="儲存緊…">
          儲存
        </SubmitButton>
        <button type="button" onClick={onDone} className="text-xs font-caption text-ink-muted hover:underline">
          取消
        </button>
      </div>
    </form>
  );
}

function LocationLabel({ row, onEdit }: { row: InventoryRow; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="text-left text-xs font-caption text-ink-faint underline decoration-dotted hover:text-accent"
    >
      {row.roomName} · {row.furnitureName}
      {row.drawerName ? ` · ${row.drawerName}` : ""}
    </button>
  );
}

function DeleteButton({ row }: { row: InventoryRow }) {
  return (
    <form action={deleteItemAction}>
      <input type="hidden" name="id" value={row.itemId} />
      <input type="hidden" name="furnitureId" value={row.furnitureId} />
      <SubmitButton className="text-xs font-caption text-red-600 hover:underline" pendingChildren="刪除緊…">
        刪除
      </SubmitButton>
    </form>
  );
}

export function InventoryItemRow({ row, rooms, furniture, drawers }: RowProps) {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  return (
    <li className="flex flex-col gap-1.5 rounded-md border border-border bg-surface p-3.5">
      <div className="flex items-center gap-2">
        <span className="flex-1 font-medium text-ink">{row.itemName}</span>
        {isEditingQuantity ? (
          <QuantityEditor row={row} onDone={() => setIsEditingQuantity(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingQuantity(true)}
            className="text-sm font-caption text-ink-muted underline decoration-dotted hover:text-accent"
            aria-label={`編輯${row.itemName}數量`}
          >
            × {row.quantity}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-mist px-2 py-0.5 text-xs font-caption text-ink-muted">
          {row.categoryName ?? "—"}
        </span>
        {row.expiryDate ? (
          <ExpiryBadge expiryDate={row.expiryDate} />
        ) : (
          <span className="text-xs font-caption text-ink-faint">—</span>
        )}
      </div>

      {isEditingLocation ? (
        <LocationEditor row={row} rooms={rooms} furniture={furniture} drawers={drawers} onDone={() => setIsEditingLocation(false)} />
      ) : (
        <LocationLabel row={row} onEdit={() => setIsEditingLocation(true)} />
      )}

      <div className="flex justify-end">
        <DeleteButton row={row} />
      </div>
    </li>
  );
}

export function InventoryItemTableRow({ row, rooms, furniture, drawers }: RowProps) {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2 font-medium text-ink">{row.itemName}</td>
      <td className="px-4 py-2 font-caption text-ink-muted">
        {isEditingQuantity ? (
          <QuantityEditor row={row} onDone={() => setIsEditingQuantity(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingQuantity(true)}
            className="underline decoration-dotted hover:text-accent"
            aria-label={`編輯${row.itemName}數量`}
          >
            {row.quantity}
          </button>
        )}
      </td>
      <td className="px-4 py-2 font-caption text-ink-muted">{row.categoryName ?? "—"}</td>
      <td className="px-4 py-2 font-caption text-ink-muted">
        {isEditingLocation ? (
          <LocationEditor row={row} rooms={rooms} furniture={furniture} drawers={drawers} onDone={() => setIsEditingLocation(false)} />
        ) : (
          <LocationLabel row={row} onEdit={() => setIsEditingLocation(true)} />
        )}
      </td>
      <td className="px-4 py-2">
        <ExpiryBadge expiryDate={row.expiryDate} />
        {!row.expiryDate && <span className="font-caption text-ink-faint">—</span>}
      </td>
      <td className="px-4 py-2">
        <DeleteButton row={row} />
      </td>
    </tr>
  );
}
```

- [ ] **Step 4: 行測試確認通過**

Run: `npx vitest run components/InventoryItemRow.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/InventoryItemRow.tsx components/InventoryItemRow.test.tsx
git commit -m "feat: add InventoryItemRow/TableRow with quantity, delete, and location editing"
```

---

## Task 11: 接線落 `/items` page

**Files:**
- Modify: `app/items/page.tsx`

**Interfaces:**
- Consumes: `AddItemToggle`(Task 9)、`InventoryItemRow`/`InventoryItemTableRow`(Task 10)、`listAllFurniture`(Task 2)、`listAllDrawers`(Task 3)、`groupItemNamesByCategoryId`(already exists in `lib/db/items.ts`)

- [ ] **Step 1: 改寫成個檔案**

將 `app/items/page.tsx` 成個內容換做:

```tsx
import { listInventory, type ExpiryStatus, type InventorySort } from "@/lib/db/inventory";
import { listRooms } from "@/lib/db/rooms";
import { listAllFurniture } from "@/lib/db/furniture";
import { listAllDrawers } from "@/lib/db/drawers";
import { listCategories } from "@/lib/db/libraries";
import { groupItemNamesByCategoryId } from "@/lib/db/items";
import { InventoryFilters } from "@/components/InventoryFilters";
import { AddItemToggle } from "@/components/AddItemToggle";
import { InventoryItemRow, InventoryItemTableRow } from "@/components/InventoryItemRow";

export const dynamic = "force-dynamic";

type Search = {
  search?: string;
  roomId?: string;
  categoryId?: string;
  expiryStatus?: string;
  sort?: string;
};

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;

  const [rows, rooms, furniture, drawers, categories, itemNamesByCategoryId] = await Promise.all([
    listInventory({
      search: params.search,
      roomId: params.roomId ? Number(params.roomId) : undefined,
      categoryId: params.categoryId ? Number(params.categoryId) : undefined,
      expiryStatus: (params.expiryStatus as ExpiryStatus) ?? "all",
      sort: (params.sort as InventorySort) ?? "name",
    }),
    listRooms(),
    listAllFurniture(),
    listAllDrawers(),
    listCategories(),
    groupItemNamesByCategoryId(),
  ]);

  const totalQuantity = rows.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-xl font-extrabold text-ink">全部物品</h1>

      <AddItemToggle
        rooms={rooms}
        furniture={furniture}
        drawers={drawers}
        categories={categories}
        itemNamesByCategoryId={itemNamesByCategoryId}
      />

      <InventoryFilters
        rooms={rooms}
        categories={categories}
        current={{
          search: params.search ?? "",
          roomId: params.roomId ?? "",
          categoryId: params.categoryId ?? "",
          expiryStatus: params.expiryStatus ?? "all",
          sort: params.sort ?? "name",
        }}
      />

      <p className="text-sm font-caption text-ink-muted">
        {rows.length} 項 · 合共 {totalQuantity} 件
      </p>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center font-caption text-ink-faint">
          冇符合條件嘅物品。
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 sm:hidden">
            {rows.map((row) => (
              <InventoryItemRow key={row.itemId} row={row} rooms={rooms} furniture={furniture} drawers={drawers} />
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-md border border-border bg-surface sm:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-mist text-left">
                <tr>
                  <th className="px-4 py-2 font-caption font-medium text-ink">物品</th>
                  <th className="px-4 py-2 font-caption font-medium text-ink">數量</th>
                  <th className="px-4 py-2 font-caption font-medium text-ink">分類</th>
                  <th className="px-4 py-2 font-caption font-medium text-ink">位置</th>
                  <th className="px-4 py-2 font-caption font-medium text-ink">到期日</th>
                  <th className="px-4 py-2 font-caption font-medium text-ink">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <InventoryItemTableRow key={row.itemId} row={row} rooms={rooms} furniture={furniture} drawers={drawers} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 全套自動化測試回歸**

Run: `npx vitest run`
Expected: PASS(全部)

- [ ] **Step 3: 手動瀏覽器驗證**

1. `npm run dev`,開 `/items`
2. 撳「新增物品」→ 展開表單,房間度揀「未定位置」→ 填名稱、數量 → 提交
3. 確認新物品出現喺清單,位置標籤顯示「未分類 · 未定位置」
4. 撳嗰個位置標籤 → 展開 `LocationPicker`,揀返一個真實房間 + 傢俬(例如「睡房 · 衣櫃」)→ 儲存
5. 確認位置標籤更新做「睡房 · 衣櫃」,去返 `/rooms/<睡房id>` 確認件物品出現喺嗰件傢俬入面
6. 撳數量,改一個新數值,儲存,確認即時更新
7. 撳刪除,確認物品消失
8. 打開 Sidebar / 房間清單,確認睇唔到「未分類」呢個房間

- [ ] **Step 4: Commit**

```bash
git add app/items/page.tsx
git commit -m "feat: wire quick-add and per-row management into the items page"
```

---

## Self-Review Notes

- **Spec 覆蓋**:資料層(Task 1-2)、位置揀選組件(Task 7)、新增表單(Task 8-9)、管理操作改數量/刪除/改位置(Task 10)、錯誤處理(Task 4 嘅櫃桶驗證經 `resolveDrawerId` 沿用)、隱藏房間唔出現喺 `listRooms()`(Task 1 測試覆蓋)全部有對應 task。
- **Placeholder scan**:冇 TBD / 未實作片段,全部 step 帶齊實際程式碼。
- **Type consistency**:`LocationPicker` 輸出嘅表單欄位名(`furnitureId`、`drawerId`)喺 Task 6(server actions)、Task 8(`QuickAddItemForm`)、Task 10(`InventoryItemRow`)三處一致;`UNASSIGNED_LOCATION_VALUE`("unassigned")喺 component 層同 server action 層(`formData.get("furnitureId") === "unassigned"`)一致對應。
