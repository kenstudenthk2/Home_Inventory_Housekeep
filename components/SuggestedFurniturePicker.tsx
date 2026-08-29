"use client";

import { useState } from "react";
import { FurnitureIcon } from "./FurnitureIcon";
import type { FurnitureType, RoomType } from "@/lib/db/types";

export function SuggestedFurniturePicker({
  roomTypes,
  suggestionsByRoomTypeId,
  defaultRoomTypeId = "",
}: {
  roomTypes: RoomType[];
  suggestionsByRoomTypeId: Record<number, FurnitureType[]>;
  defaultRoomTypeId?: number | "";
}) {
  const [roomTypeId, setRoomTypeId] = useState<number | "">(defaultRoomTypeId);
  const suggestions = roomTypeId === "" ? [] : (suggestionsByRoomTypeId[roomTypeId] ?? []);

  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor="roomTypeId" className="text-sm font-caption font-medium text-ink-muted">
          房間類型
        </label>
        <select
          id="roomTypeId"
          name="roomTypeId"
          value={roomTypeId}
          onChange={(e) => setRoomTypeId(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
        >
          <option value="">(唔指定)</option>
          {roomTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {suggestions.length > 0 && (
        <fieldset className="rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-caption font-medium text-ink-muted">建議傢俬</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="suggestedFurnitureTypeIds" value={s.id} className="h-5 w-5" />
                <FurnitureIcon iconKey={s.iconKey} className="h-4 w-4 text-ink-muted" />
                {s.name}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs font-caption text-ink-faint">
            揀咗嘅傢俬會自動加入呢個房間。之後仲可以喺房間頁面加更多。
          </p>
        </fieldset>
      )}
    </>
  );
}
