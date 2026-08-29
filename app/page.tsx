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
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-3 font-heading font-semibold text-amber-900">到期提醒({expiring.length})</h2>
          <ul className="flex flex-col gap-3">
            {expiring.map((row) => (
              <li key={row.itemId} className="flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                <div className="flex items-center gap-2">
                  <ExpiryBadge expiryDate={row.expiryDate} />
                  <span className="font-medium text-ink">{row.itemName}</span>
                </div>
                <span className="font-caption text-ink-muted">
                  {row.roomName} · {row.furnitureName} · {row.quantity} 件
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-heading text-xl font-extrabold text-ink">房間</h1>
          <Link
            href="/rooms/new"
            className="inline-flex h-11 items-center gap-1 rounded-sm bg-accent px-3 text-sm font-caption font-semibold text-white hover:bg-accent-light"
          >
            <Plus className="h-4 w-4" aria-hidden />
            新增房間
          </Link>
        </div>

        {rooms.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-8 text-center font-caption text-ink-faint">
            仲未有房間。㩒「新增房間」開始記錄。
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/rooms/${room.id}`}
                  className="block rounded-md border border-border bg-surface p-4 shadow-sm hover:border-accent"
                >
                  <h3 className="font-heading font-semibold text-ink">{room.name}</h3>
                  <p className="mt-1 text-sm font-sans text-ink-muted">
                    {room.roomTypeLabel ?? "未分類"}
                    {room.widthCm && room.lengthCm
                      ? ` · ${room.widthCm} × ${room.lengthCm} cm`
                      : ""}
                  </p>
                  <p className="mt-2 text-sm font-caption text-ink-muted">
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
