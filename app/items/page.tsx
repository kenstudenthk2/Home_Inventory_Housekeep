import Link from "next/link";
import { listInventory, type ExpiryStatus, type InventorySort } from "@/lib/db/inventory";
import { listRooms } from "@/lib/db/rooms";
import { listCategories } from "@/lib/db/libraries";
import { InventoryFilters } from "@/components/InventoryFilters";
import { ExpiryBadge } from "@/components/ExpiryBadge";

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

  const [rows, rooms, categories] = await Promise.all([
    listInventory({
      search: params.search,
      roomId: params.roomId ? Number(params.roomId) : undefined,
      categoryId: params.categoryId ? Number(params.categoryId) : undefined,
      expiryStatus: (params.expiryStatus as ExpiryStatus) ?? "all",
      sort: (params.sort as InventorySort) ?? "name",
    }),
    listRooms(),
    listCategories(),
  ]);

  const totalQuantity = rows.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">全部物品</h1>

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

      <p className="text-sm text-slate-500">
        {rows.length} 項 · 合共 {totalQuantity} 件
      </p>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          冇符合條件嘅物品。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">物品</th>
                <th className="px-4 py-2 font-medium">數量</th>
                <th className="px-4 py-2 font-medium">分類</th>
                <th className="px-4 py-2 font-medium">位置</th>
                <th className="px-4 py-2 font-medium">到期日</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.itemId} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 font-medium">{row.itemName}</td>
                  <td className="px-4 py-2">{row.quantity}</td>
                  <td className="px-4 py-2 text-slate-600">{row.categoryName ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    <Link href={`/rooms/${row.roomId}`} className="hover:underline">
                      {row.roomName}
                    </Link>
                    {" · "}
                    <Link href={`/furniture/${row.furnitureId}`} className="hover:underline">
                      {row.furnitureName}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <ExpiryBadge expiryDate={row.expiryDate} />
                    {!row.expiryDate && <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
