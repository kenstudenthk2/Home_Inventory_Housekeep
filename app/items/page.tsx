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
      <h1 className="font-heading text-xl font-extrabold text-ink">全部物品</h1>

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
              <li
                key={row.itemId}
                className="flex flex-col gap-1.5 rounded-md border border-border bg-surface p-3.5"
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-medium text-ink">{row.itemName}</span>
                  <span className="text-sm font-caption text-ink-muted">× {row.quantity}</span>
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
                <p className="text-xs font-caption text-ink-faint">
                  <Link href={`/rooms/${row.roomId}`} className="hover:underline">
                    {row.roomName}
                  </Link>
                  {" · "}
                  <Link href={`/furniture/${row.furnitureId}`} className="hover:underline">
                    {row.furnitureName}
                  </Link>
                </p>
              </li>
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
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.itemId} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium text-ink">{row.itemName}</td>
                    <td className="px-4 py-2 font-caption text-ink-muted">{row.quantity}</td>
                    <td className="px-4 py-2 font-caption text-ink-muted">{row.categoryName ?? "—"}</td>
                    <td className="px-4 py-2 font-caption text-ink-muted">
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
                      {!row.expiryDate && <span className="font-caption text-ink-faint">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
