import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { getRoom } from "@/lib/db/rooms";
import { listFurnitureInRoom } from "@/lib/db/furniture";
import { addFurnitureAction, deleteFurnitureAction } from "@/app/actions/furniture";
import { FurnitureIcon } from "@/components/FurnitureIcon";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoom(Number(id));
  if (!room) notFound();

  const furniture = await listFurnitureInRoom(room.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{room.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {room.roomTypeLabel ?? "未分類"}
            {room.widthCm && room.lengthCm ? ` · ${room.widthCm} × ${room.lengthCm} cm` : ""}
          </p>
        </div>
        <Link href={`/rooms/${room.id}/edit`} className="text-sm text-slate-600 hover:underline">
          編輯房間
        </Link>
      </div>

      <section>
        <h2 className="mb-3 font-semibold">傢俬({furniture.length})</h2>

        {furniture.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">
            仲未有傢俬。
          </p>
        ) : (
          <ul className="mb-4 flex flex-col gap-2">
            {furniture.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
              >
                <Link href={`/furniture/${item.id}`} className="flex flex-1 items-center gap-3">
                  <FurnitureIcon iconKey={item.iconKey} className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="font-medium">{item.displayName}</p>
                    <p className="text-sm text-slate-500">{item.itemCount} 件物品</p>
                  </div>
                </Link>
                <form action={deleteFurnitureAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`刪除${item.displayName}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={addFurnitureAction} className="flex items-end gap-2">
          <input type="hidden" name="roomId" value={room.id} />
          <div className="flex-1">
            <label htmlFor="furnitureTypeName" className="mb-1 block text-sm text-slate-600">
              新增傢俬
            </label>
            <input
              id="furnitureTypeName"
              name="furnitureTypeName"
              placeholder="例如:衣櫃"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <Plus className="h-4 w-4" aria-hidden />
            新增
          </button>
        </form>
      </section>
    </div>
  );
}
