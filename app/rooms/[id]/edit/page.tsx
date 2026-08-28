import { notFound } from "next/navigation";
import { listRoomTypes, loadSuggestionMap } from "@/lib/db/libraries";
import { getRoom } from "@/lib/db/rooms";
import { updateRoomAction, deleteRoomAction } from "@/app/actions/rooms";
import { RoomForm } from "@/components/RoomForm";

export const dynamic = "force-dynamic";

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoom(Number(id));
  if (!room) notFound();

  const roomTypes = await listRoomTypes();
  const suggestionsByRoomTypeId = await loadSuggestionMap(roomTypes.map((t) => t.id));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-6 text-xl font-semibold">編輯房間</h1>
        <RoomForm
          roomTypes={roomTypes}
          suggestionsByRoomTypeId={suggestionsByRoomTypeId}
          room={room}
          action={updateRoomAction}
          submitLabel="儲存"
        />
      </div>

      <form action={deleteRoomAction} className="border-t border-slate-200 pt-6">
        <input type="hidden" name="id" value={room.id} />
        <button type="submit" className="text-sm text-red-600 hover:underline">
          刪除呢個房間(連同入面所有傢俬同物品)
        </button>
      </form>
    </div>
  );
}
