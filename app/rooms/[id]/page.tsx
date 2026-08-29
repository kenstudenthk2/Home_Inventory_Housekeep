import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoom } from "@/lib/db/rooms";
import { listFurnitureInRoom } from "@/lib/db/furniture";
import { getRoomItemSummary, listItemsInRoom, groupItemNamesByCategoryId } from "@/lib/db/items";
import { listCategories } from "@/lib/db/libraries";
import { RoomItemSummary } from "@/components/RoomItemSummary";
import { RoomWorkspace } from "@/components/RoomWorkspace";
import type { Item } from "@/lib/db/types";

export const dynamic = "force-dynamic";

function groupByFurnitureId(items: Item[]): Record<number, Item[]> {
  const grouped: Record<number, Item[]> = {};
  for (const item of items) {
    (grouped[item.furnitureId] ??= []).push(item);
  }
  return grouped;
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoom(Number(id));
  if (!room) notFound();

  const [furniture, itemSummary, items, categories, itemNamesByCategoryId] = await Promise.all([
    listFurnitureInRoom(room.id),
    getRoomItemSummary(room.id),
    listItemsInRoom(room.id),
    listCategories(),
    groupItemNamesByCategoryId(),
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

      <RoomWorkspace
        roomId={room.id}
        furniture={furniture}
        itemsByFurnitureId={groupByFurnitureId(items)}
        categories={categories}
        itemNamesByCategoryId={itemNamesByCategoryId}
      />
    </div>
  );
}
