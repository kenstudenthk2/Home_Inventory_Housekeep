import { listRoomTypes, loadSuggestionMap } from "@/lib/db/libraries";
import { createRoomAction } from "@/app/actions/rooms";
import { RoomForm } from "@/components/RoomForm";

export const dynamic = "force-dynamic";

export default async function NewRoomPage() {
  const roomTypes = await listRoomTypes();
  const suggestionsByRoomTypeId = await loadSuggestionMap(roomTypes.map((t) => t.id));

  return (
    <div>
      <h1 className="mb-6 font-heading text-xl font-extrabold text-ink">新增房間</h1>
      <RoomForm
        roomTypes={roomTypes}
        suggestionsByRoomTypeId={suggestionsByRoomTypeId}
        action={createRoomAction}
        submitLabel="建立房間"
      />
    </div>
  );
}
