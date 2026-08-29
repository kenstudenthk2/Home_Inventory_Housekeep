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
        <label htmlFor="name" className="text-sm font-caption font-medium text-ink-muted">
          房間名稱
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={room?.name ?? ""}
          placeholder="例如:主人房"
          className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
        />
      </div>

      <SuggestedFurniturePicker
        roomTypes={roomTypes}
        suggestionsByRoomTypeId={suggestionsByRoomTypeId}
        defaultRoomTypeId={room?.roomTypeId ?? ""}
      />

      <fieldset className="rounded-md border border-border p-3">
        <legend className="px-1 text-sm font-caption font-medium text-ink-muted">房間尺寸(選填)</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            name="widthCm"
            type="number"
            min="1"
            step="0.1"
            defaultValue={room?.widthCm ?? ""}
            placeholder="闊"
            className="w-full rounded-sm border border-border-input px-3 py-2 text-base sm:w-28 sm:text-sm"
          />
          <span className="text-sm font-caption text-ink-muted sm:inline">cm ×</span>
          <input
            name="lengthCm"
            type="number"
            min="1"
            step="0.1"
            defaultValue={room?.lengthCm ?? ""}
            placeholder="長"
            className="w-full rounded-sm border border-border-input px-3 py-2 text-base sm:w-28 sm:text-sm"
          />
          <span className="text-sm font-caption text-ink-muted sm:inline">cm</span>
        </div>
      </fieldset>

      <button
        type="submit"
        className="h-11 w-full rounded-sm bg-accent px-4 text-sm font-caption font-semibold text-white hover:bg-accent-light"
      >
        {submitLabel}
      </button>
    </form>
  );
}
