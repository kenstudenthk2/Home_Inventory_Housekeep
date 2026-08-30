# 「全部物品」page 新增 + 管理物品

日期:2026-08-30

## 背景

`/items`(全部物品)而家淨係一個讀取用嘅篩選 + 清單頁,冇任何新增/編輯/刪除操作。新增物品淨係可以喺 `/rooms/[id]` 嘅 `RoomWorkspace` 入面、揀咗一件已存在嘅傢俬之後先做到,因為 `ItemForm` 要求一個固定嘅 `furnitureId`。

用戶想喺「全部物品」page 度直接:
1. 撳掣新增物品
2. 管理(改數量、刪除、改位置)已有嘅物品

## 範圍

- `/items` page 加「新增物品」掣 + 頁面頂展開表單
- 每行物品加管理操作:改數量、刪除(沿用而家 `ItemRow` 嘅模式)、**新增**改位置功能
- 新增物品時,位置可以揀「未定位置」,唔使即時決定實際房間/傢俬
- 唔改 DB schema、唔改 `/furniture/[id]`、唔改 `RoomWorkspace` 既有行為

## 資料層設計:「未定位置」

唔加 migration、唔改任何表結構。用一個**系統自動建立嘅隱藏房間 + 隱藏傢俬**達成:

- 保留名稱常數(例如房間 `"未分類"`、傢俬 `"未定位置"`),用嚟 find-or-create 呢兩筆隱藏記錄
- 第一次有人喺新增物品表單揀「未定位置」,伺服器先 find-or-create 呢個隱藏房間 + 傢俬(冪等,之後重用同一筆記錄),攞到真實 `furnitureId` 先執行而家已有嘅 `createItem()`
- `listRooms()` 過濾走呢個隱藏房間名稱,所以佢唔會出現喺 Sidebar、房間清單、`RoomWorkspace` 嘅傢俬揀選器,或者任何其他房間相關 UI
- 已知限制:如果用戶手動開一個名稱完全一樣嘅房間(`"未分類"`),會被當做隱藏房間過濾走。呢個 app 係單一家庭用,呢個 edge case 接受,唔額外處理

## 組件設計

### 新增 `components/LocationPicker.tsx`(client component)

三層連鎖下拉:房間 → 傢俬 → 櫃桶(如果有)。房間嗰層最頂有個特殊選項「未定位置」,揀咗就跳過傢俬/櫃桶,直接完成揀選。

Props:
- `rooms: RoomSummary[]`(唔含隱藏房間)
- `furniture: (Furniture & { roomId: number })[]`(全部房間嘅傢俬,平鋪)
- `drawers: Drawer[]`(全部傢俬嘅櫃桶,平鋪)
- `defaultRoomId?, defaultFurnitureId?, defaultDrawerId?`(編輯現有物品位置時預選)
- 表單欄位名固定輸出:`furnitureId`(數值,或者字串 `"unassigned"`)、`drawerId`

行為:揀房間後,喺 `furniture` 裡面用 `roomId` 篩選畀第二層下拉;揀傢俬後,喺 `drawers` 裡面用 `furnitureId` 篩選,有記錄先顯示第三層。全部喺 client 端記憶體篩選,唔額外 fetch。

呢個組件會喺「新增物品表單」同「管理物品的改位置」兩處重用。

### 新增 `components/QuickAddItemForm.tsx`(client component)

頁面頂展開嘅新增物品表單,結構同而家 `ItemForm` 相似(分類 + 物品名稱 combobox + 數量 + 到期日),用 `LocationPicker` 代替固定嘅 `furnitureId` hidden input。

### 新增 `components/InventoryRow.tsx`(client component)

取代而家 `/items` page 手寫嘅 `<li>`/`<tr>`,支援:
- 改數量(沿用 `ItemRow` 嘅 inline 編輯模式)
- 刪除
- **改位置**(新):撳位置文字展開 `LocationPicker`,預選現有位置,儲存後搬去新傢俬/櫃桶(或者搬去「未定位置」)

沿用行動裝置卡片 + 桌面表格兩種顯示,同而家一致。

## Server Actions / DB 改動

- `app/actions/items.ts` — `createItemAction` 擴充:讀到 `furnitureId === "unassigned"` 就先 find-or-create 隱藏房間 + 傢俬先攞真實 id
- `app/actions/items.ts` — 新增 `updateItemLocationAction`:攞 `id`、新 `furnitureId`(或 `"unassigned"`)、`drawerId`,call 新嘅 db 函數搬位置
- `lib/db/rooms.ts` — 新增 `findOrCreateUnassignedRoom()`;`listRooms()` 過濾隱藏房間名稱
- `lib/db/furniture.ts` — 新增 `findOrCreateUnassignedFurniture()`、`listAllFurnitureWithRoom()`(平鋪、附 `roomId`,畀 `LocationPicker` 用)
- `lib/db/drawers.ts` — 新增 `listAllDrawersFlat()`(平鋪全部櫃桶,畀 `LocationPicker` 用)
- `lib/db/items.ts` — 新增 `moveItemLocation(id, furnitureId, drawerId)`,重用而家已有嘅櫃桶驗證邏輯(目標傢俬有櫃桶但冇揀就拋錯)

## 錯誤處理

- 搬位置去一件有櫃桶嘅傢俬,但冇揀櫃桶 → 拋錯「呢件傢俬有櫃桶,加物品前要揀返一個櫃桶」,喺表單顯示,唔靜默失敗(同而家 `createItem`/`updateItem` 一致嘅驗證訊息)
- 新增/搬位置/刪除完成後,`revalidatePath` 埋 `/items`、`/`,同埋(搬位置時)新舊傢俬所屬房間嘅 `/rooms/[id]`,等用戶去返嗰啲房間都見到最新狀態

## 測試

- `lib/db/rooms.test.ts` / `furniture.test.ts`:隱藏房間 + 傢俬 find-or-create 冪等性;`listRooms()` 唔會漏咗佢出嚟
- `lib/db/items.test.ts`:`moveItemLocation` 有櫃桶要驗證、冇揀就拋錯
- Server action 測試:`"unassigned"` sentinel 解析成功,攞到真實 `furnitureId`
- 手動瀏覽器驗證:新增物品揀「未定位置」→「全部物品」見到標住未定位置 → 改位置搬去真實傢俬 → 確認消失喺未定位置、出現喺目標傢俬/房間

## 實施階段(對應 CLAUDE.md 嘅範圍規則)

呢個 feature 改動檔案數量超過 3 個,會用 `writing-plans` skill 拆做細階段實施,每階段獨立測試先過落一步:

1. Data layer:隱藏房間/傢俬 find-or-create + 平鋪查詢函數 + 測試
2. `LocationPicker` 組件
3. `QuickAddItemForm` + `createItemAction` 擴充,接埋落 `/items` page
4. `InventoryRow`(改數量/刪除/改位置)+ `updateItemLocationAction`,接埋落 `/items` page
