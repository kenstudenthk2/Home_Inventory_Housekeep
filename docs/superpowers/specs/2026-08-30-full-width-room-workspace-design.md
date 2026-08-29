# Full-width layout + 房間工作區 (兩欄式傢俬/物品管理)

日期:2026-08-30

## 背景

而家全個 app 用 `max-w-5xl` 局限畫面闊度,房間詳情頁(`/rooms/[id]`)將傢俬列表同物品摘要垂直疊埋一齊,冇分欄。用戶想要:

1. 全個 app 變全闊(拎走 `max-w-5xl` 局限)
2. 房間詳情頁改做兩欄工作區:右邊傢俬列表,中間顯示揀選緊嗰件傢俬嘅物品列表
3. 目的係方便管理單一房間入面嘅傢俬同物品

## 範圍

- 全 app 全闊:改 `app/layout.tsx` 同 `components/AppHeader.tsx`
- 房間詳情頁(`app/rooms/[id]/page.tsx`)改做兩欄互動工作區
- `/furniture/[id]` 獨立頁面唔改,繼續存在(留返俾其他入口用)

## 架構

### 全闊佈局

`app/layout.tsx` 嘅 `<main>` 同 `AppHeader.tsx` 內層 container,拎走 `mx-auto max-w-5xl`,淨係留低 padding(`px-4`,大螢幕 `lg:px-8`)。所有頁面即時變全闊,毋須逐頁改。

### 房間工作區兩欄佈局

`lg`(≥1024px)或以上螢幕:`grid-cols-[1fr_320px]`,中間物品、右邊傢俬。
窄螢幕(< `lg`):直向堆疊,順序係「傢俬選擇」在上、「物品」在下 — 因為用戶要揀咗傢俬先至有嘢睇。

頁面頂部保留而家嘅「物品總覽」(`RoomItemSummary`)收合摘要組件唔改,擺喺兩欄工作區上面。

## 組件

### 新增 `components/RoomWorkspace.tsx`(client component)

Props:
- `roomId: number`
- `furniture: FurnitureSummary[]`
- `itemsByFurnitureId: Record<number, Item[]>`
- `categories: Category[]`
- `itemNamesByCategoryId: Record<number, string[]>`

行為:
- `useState` 記住 `selectedFurnitureId`,預設值係 `furniture[0]?.id ?? null`
- 右欄:渲染傢俬清單(撳一下就切換 `selectedFurnitureId`,唔再跳去 `/furniture/[id]`),揀選緊嗰件用 accent 底色/邊框標示;每件都保留刪除按鈕(沿用 `deleteFurnitureAction`);清單下面係新增傢俬表單(沿用 `addFurnitureAction`)
- 中欄:顯示 `itemsByFurnitureId[selectedFurnitureId]`,重用 `ItemRow`(編輯/刪除物品)同 `ItemForm`(新增物品,`action={createItemAction}`);如果 `selectedFurnitureId` 係 `null`(房間仲未有傢俬)就顯示提示文字
- 刪除揀選緊嗰件傢俬之後,`selectedFurnitureId` 要 fallback 去剩低清單嘅第一件(或者 `null`)

### `app/rooms/[id]/page.tsx` 改動

- 保留 `getRoom`、`listFurnitureInRoom`、`getRoomItemSummary`
- 新加 `listItemsInRoom(roomId)`、`listCategories()`、`groupItemNamesByCategoryId()`(同 `/furniture/[id]` 頁而家用緊嗰啲一樣)
- 將 items 按 `furnitureId` group 做 `Record<number, Item[]>`,連同其他 props 一齊傳落 `RoomWorkspace`
- 拎走而家內嵌喺 page 度嘅傢俬列表 JSX 同新增傢俬表單(搬咗去 `RoomWorkspace`)

## 資料層

### `lib/db/items.ts` 新增 `listItemsInRoom`

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

一次過攞晒成間房嘅物品(每件都帶返 `furnitureId`),喺 `RoomPage` 呢個 server component 度用 `Object.groupBy`(或者手寫 reduce)按 `furnitureId` 分組,傳落 client component,唔使逐件傢俬分開 fetch。

### `app/actions/items.ts` revalidatePath 加返房間路徑

`createItemAction`、`updateItemAction`、`deleteItemAction` 而家淨係 `revalidatePath('/furniture/${furnitureId}')`。因為而家呢啲 action 有機會由房間頁觸發,加返一步:攞 `getFurniture(furnitureId)`(嚟自 `lib/db/furniture.ts`,同 `deleteFurnitureAction` 而家用緊嗰個做法一樣)攞到 `roomId`,然後 `revalidatePath('/rooms/${roomId}')`。

## 錯誤處理

- `listItemsInRoom` 同其他讀取函數一樣,Supabase 出錯就 `throw new Error(...)`,交俾 Next.js 嘅 `error.tsx` 處理,同現有模式一致。
- 房間冇傢俬嗰陣(`furniture.length === 0`),`RoomWorkspace` 中欄顯示「仲未有傢俬,右邊新增一件先」,唔顯示 `ItemForm`(因為冇 `furnitureId` 可以掛)。

## 測試

- 現有 73 個測試唔應該爆 — 呢次改動係 layout 同新組件,冇改動業務邏輯 (`lib/db/*` 嘅驗證函數、`app/actions/*` 嘅核心邏輯不變)。
- 新增 `components/RoomWorkspace.test.tsx`:
  - 預設揀選第一件傢俬,中欄顯示佢嘅物品
  - 撳第二件傢俬,中欄切換顯示第二件嘅物品
  - 冇傢俬嗰陣顯示提示文字,唔顯示 `ItemForm`
  - 刪除揀選緊嗰件傢俬後,`selectedFurnitureId` fallback 去下一件或 `null`
