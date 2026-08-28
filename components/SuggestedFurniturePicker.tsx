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
        <label htmlFor="roomTypeId" className="text-sm font-medium text-slate-700">
          房間類型
        </label>
        <select
          id="roomTypeId"
          name="roomTypeId"
          value={roomTypeId}
          onChange={(e) => setRoomTypeId(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        <fieldset className="rounded-md border border-slate-200 p-3">
          <legend className="px-1 text-sm font-medium text-slate-700">建議傢俬</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="suggestedFurnitureTypeIds" value={s.id} />
                <FurnitureIcon iconKey={s.iconKey} className="h-4 w-4 text-slate-500" />
                {s.name}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            揀咗嘅傢俬會自動加入呢個房間。之後仲可以喺房間頁面加更多。
          </p>
        </fieldset>
      )}
    </>
  );
}
