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
