import Link from "next/link";
import { notFound } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { getRoom } from "@/lib/db/rooms";
import { listFurnitureInRoom } from "@/lib/db/furniture";
import { getRoomItemSummary } from "@/lib/db/items";
import { addFurnitureAction, deleteFurnitureAction } from "@/app/actions/furniture";
import { FurnitureIcon } from "@/components/FurnitureIcon";
import { SubmitButton } from "@/components/SubmitButton";
import { RoomItemSummary } from "@/components/RoomItemSummary";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoom(Number(id));
  if (!room) notFound();

  const [furniture, itemSummary] = await Promise.all([
    listFurnitureInRoom(room.id),
    getRoomItemSummary(room.id),
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

      <section>
        <h2 className="mb-3 font-heading font-semibold text-ink">傢俬({furniture.length})</h2>

        {furniture.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center font-caption text-ink-faint">
            仲未有傢俬。
          </p>
        ) : (
          <ul className="mb-4 flex flex-col gap-2">
            {furniture.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface p-3"
              >
                <Link href={`/furniture/${item.id}`} className="flex flex-1 items-center gap-3">
                  <FurnitureIcon iconKey={item.iconKey} className="h-5 w-5 text-ink-muted" />
                  <div>
                    <p className="font-medium text-ink">{item.displayName}</p>
                    <p className="text-sm font-caption text-ink-muted">{item.itemCount} 件物品</p>
                  </div>
                </Link>
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
              </li>
            ))}
          </ul>
        )}

        <form action={addFurnitureAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="roomId" value={room.id} />
          <div className="flex-1">
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
