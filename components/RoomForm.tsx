import { SuggestedFurniturePicker } from "./SuggestedFurniturePicker";
import type { FurnitureType, Room, RoomType } from "@/lib/db/types";

export function RoomForm({
  roomTypes,
  suggestionsByRoomTypeId,
  room,
  action,
  submitLabel,
}: {
  roomTypes: RoomType[];
  suggestionsByRoomTypeId: Record<number, FurnitureType[]>;
  room?: Room;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      {room && <input type="hidden" name="id" value={room.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          房間名稱
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={room?.name ?? ""}
          placeholder="例如:主人房"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <SuggestedFurniturePicker
        roomTypes={roomTypes}
        suggestionsByRoomTypeId={suggestionsByRoomTypeId}
        defaultRoomTypeId={room?.roomTypeId ?? ""}
      />

      <fieldset className="rounded-md border border-slate-200 p-3">
        <legend className="px-1 text-sm font-medium text-slate-700">房間尺寸(選填)</legend>
        <div className="flex items-center gap-2">
          <input
            name="widthCm"
            type="number"
            min="1"
            step="0.1"
            defaultValue={room?.widthCm ?? ""}
            placeholder="闊"
            className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <span className="text-sm text-slate-500">cm ×</span>
          <input
            name="lengthCm"
            type="number"
            min="1"
            step="0.1"
            defaultValue={room?.lengthCm ?? ""}
            placeholder="長"
            className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <span className="text-sm text-slate-500">cm</span>
        </div>
      </fieldset>

      <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
        {submitLabel}
      </button>
    </form>
  );
}
