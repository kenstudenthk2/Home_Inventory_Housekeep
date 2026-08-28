import Link from "next/link";
import { Plus } from "lucide-react";
import { listRooms } from "@/lib/db/rooms";
import { listExpiringItems } from "@/lib/db/inventory";
import { ExpiryBadge } from "@/components/ExpiryBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [rooms, expiring] = await Promise.all([listRooms(), listExpiringItems()]);

  return (
    <div className="flex flex-col gap-8">
      {expiring.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-3 font-semibold text-amber-900">到期提醒({expiring.length})</h2>
          <ul className="flex flex-col gap-2">
            {expiring.map((row) => (
              <li key={row.itemId} className="flex flex-wrap items-center gap-2 text-sm">
                <ExpiryBadge expiryDate={row.expiryDate} />
                <span className="font-medium">{row.itemName}</span>
                <span className="text-slate-500">
                  {row.roomName} · {row.furnitureName} · {row.quantity} 件
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">房間</h1>
          <Link
            href="/rooms/new"
            className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white"
          >
            <Plus className="h-4 w-4" aria-hidden />
            新增房間
          </Link>
        </div>

        {rooms.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
            仲未有房間。㩒「新增房間」開始記錄。
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/rooms/${room.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400"
                >
                  <h3 className="font-medium">{room.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {room.roomTypeLabel ?? "未分類"}
                    {room.widthCm && room.lengthCm
                      ? ` · ${room.widthCm} × ${room.lengthCm} cm`
                      : ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {room.furnitureCount} 件傢俬 · {room.itemCount} 件物品
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
