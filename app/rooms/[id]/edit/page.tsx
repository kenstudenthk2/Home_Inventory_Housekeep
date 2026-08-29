import { notFound } from "next/navigation";
import { listRoomTypes, loadSuggestionMap } from "@/lib/db/libraries";
import { getRoom } from "@/lib/db/rooms";
import { updateRoomAction, deleteRoomAction } from "@/app/actions/rooms";
import { RoomForm } from "@/components/RoomForm";
import { SubmitButton } from "@/components/SubmitButton";

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
        <h1 className="mb-6 font-heading text-xl font-extrabold text-ink">編輯房間</h1>
        <RoomForm
          roomTypes={roomTypes}
          suggestionsByRoomTypeId={suggestionsByRoomTypeId}
          room={room}
          action={updateRoomAction}
          submitLabel="儲存"
        />
      </div>

      <form action={deleteRoomAction} className="border-t border-border pt-6">
        <input type="hidden" name="id" value={room.id} />
        <SubmitButton className="text-sm font-caption text-red-600 hover:underline">
          {(pending) => (pending ? "刪除緊…" : "刪除呢個房間(連同入面所有傢俬同物品)")}
        </SubmitButton>
      </form>
    </div>
  );
}
