"use client";

import { useMemo, useState } from "react";
import type { Drawer, Furniture } from "@/lib/db/types";
import type { RoomSummary } from "@/lib/db/rooms";

export const UNASSIGNED_LOCATION_VALUE = "unassigned";

export function LocationPicker({
  rooms,
  furniture,
  drawers,
  defaultFurnitureId,
  defaultDrawerId,
  idPrefix,
}: {
  rooms: RoomSummary[];
  furniture: Furniture[];
  drawers: Drawer[];
  /** 預選畀擁有呢個 furniture id 嘅房間/傢俬(例如編輯現有物品嘅位置)。 */
  defaultFurnitureId?: number | null;
  defaultDrawerId?: number | null;
  /** 畀呢個 picker 嘅 element id 加前綴,等一版頁面可以放幾個實例。 */
  idPrefix: string;
}) {
  const defaultFurniture = furniture.find((f) => f.id === defaultFurnitureId) ?? null;
  const defaultRoomKnown = defaultFurniture !== null && rooms.some((r) => r.id === defaultFurniture.roomId);

  const [roomValue, setRoomValue] = useState<string>(
    defaultRoomKnown
      ? String(defaultFurniture!.roomId)
      : defaultFurnitureId != null
        ? UNASSIGNED_LOCATION_VALUE
        : "",
  );
  const [furnitureId, setFurnitureId] = useState<number | null>(defaultFurniture?.id ?? null);
  const [drawerId, setDrawerId] = useState<number | null>(defaultDrawerId ?? null);

  const isUnassigned = roomValue === UNASSIGNED_LOCATION_VALUE;
  const roomChosen = roomValue !== "" && !isUnassigned;

  const furnitureInRoom = useMemo(
    () => (roomChosen ? furniture.filter((f) => f.roomId === Number(roomValue)) : []),
    [furniture, roomValue, roomChosen],
  );
  const drawersInFurniture = useMemo(
    () => (furnitureId === null ? [] : drawers.filter((d) => d.furnitureId === furnitureId)),
    [drawers, furnitureId],
  );

  function handleRoomChange(value: string) {
    setRoomValue(value);
    setFurnitureId(null);
    setDrawerId(null);
  }

  function handleFurnitureChange(value: string) {
    setFurnitureId(value === "" ? null : Number(value));
    setDrawerId(null);
  }

  const showDrawerSelect = roomChosen && drawersInFurniture.length > 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={`${idPrefix}-room`} className="text-sm font-caption font-medium text-ink-muted">
          房間
        </label>
        <select
          id={`${idPrefix}-room`}
          required
          value={roomValue}
          onChange={(e) => handleRoomChange(e.target.value)}
          className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
        >
          <option value="" disabled>
            揀房間…
          </option>
          <option value={UNASSIGNED_LOCATION_VALUE}>未定位置</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {roomChosen && (
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={`${idPrefix}-furniture`} className="text-sm font-caption font-medium text-ink-muted">
            傢俬
          </label>
          <select
            id={`${idPrefix}-furniture`}
            required
            value={furnitureId ?? ""}
            onChange={(e) => handleFurnitureChange(e.target.value)}
            className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          >
            <option value="" disabled>
              揀一件傢俬…
            </option>
            {furnitureInRoom.map((f) => (
              <option key={f.id} value={f.id}>
                {f.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {showDrawerSelect && (
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={`${idPrefix}-drawer`} className="text-sm font-caption font-medium text-ink-muted">
            櫃桶
          </label>
          <select
            id={`${idPrefix}-drawer`}
            required
            value={drawerId ?? ""}
            onChange={(e) => setDrawerId(e.target.value === "" ? null : Number(e.target.value))}
            className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          >
            <option value="" disabled>
              揀一個櫃桶…
            </option>
            {drawersInFurniture.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <input
        type="hidden"
        name="furnitureId"
        value={isUnassigned ? UNASSIGNED_LOCATION_VALUE : (furnitureId ?? "")}
      />
      <input type="hidden" name="drawerId" value={showDrawerSelect ? (drawerId ?? "") : ""} />
    </div>
  );
}
