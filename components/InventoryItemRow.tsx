"use client";

import { useState } from "react";
import { ExpiryBadge } from "./ExpiryBadge";
import { SubmitButton } from "./SubmitButton";
import { LocationPicker } from "./LocationPicker";
import { deleteItemAction, updateItemAction, updateItemLocationAction } from "@/app/actions/items";
import type { Drawer, Furniture } from "@/lib/db/types";
import type { RoomSummary } from "@/lib/db/rooms";
import type { InventoryRow } from "@/lib/db/inventory";

type RowProps = {
  row: InventoryRow;
  rooms: RoomSummary[];
  furniture: Furniture[];
  drawers: Drawer[];
};

function QuantityEditor({ row, onDone }: { row: InventoryRow; onDone: () => void }) {
  async function handleSave(formData: FormData) {
    await updateItemAction(formData);
    onDone();
  }

  return (
    <form action={handleSave} className="flex items-center gap-1">
      <input type="hidden" name="id" value={row.itemId} />
      <input type="hidden" name="furnitureId" value={row.furnitureId} />
      <input type="hidden" name="name" value={row.itemName} />
      {row.drawerId != null && <input type="hidden" name="drawerId" value={row.drawerId} />}
      {row.categoryId != null && <input type="hidden" name="categoryId" value={row.categoryId} />}
      {row.expiryDate && <input type="hidden" name="expiryDate" value={row.expiryDate} />}
      <input
        type="number"
        name="quantity"
        min="1"
        step="1"
        defaultValue={row.quantity}
        autoFocus
        className="w-16 rounded-sm border border-border-input px-2 py-1 text-sm"
      />
      <SubmitButton className="text-xs font-caption text-accent hover:underline" pendingChildren="儲存緊…">
        儲存
      </SubmitButton>
      <button type="button" onClick={onDone} className="text-xs font-caption text-ink-muted hover:underline">
        取消
      </button>
    </form>
  );
}

function LocationEditor({ row, rooms, furniture, drawers, onDone }: RowProps & { onDone: () => void }) {
  async function handleSave(formData: FormData) {
    await updateItemLocationAction(formData);
    onDone();
  }

  return (
    <form action={handleSave} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="id" value={row.itemId} />
      <input type="hidden" name="currentFurnitureId" value={row.furnitureId} />
      <LocationPicker
        rooms={rooms}
        furniture={furniture}
        drawers={drawers}
        defaultFurnitureId={row.furnitureId}
        defaultDrawerId={row.drawerId}
        idPrefix={`item-${row.itemId}-location`}
      />
      <div className="flex gap-2">
        <SubmitButton className="text-xs font-caption text-accent hover:underline" pendingChildren="儲存緊…">
          儲存
        </SubmitButton>
        <button type="button" onClick={onDone} className="text-xs font-caption text-ink-muted hover:underline">
          取消
        </button>
      </div>
    </form>
  );
}

function LocationLabel({ row, onEdit }: { row: InventoryRow; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="text-left text-xs font-caption text-ink-faint underline decoration-dotted hover:text-accent"
    >
      {row.roomName} · {row.furnitureName}
      {row.drawerName ? ` · ${row.drawerName}` : ""}
    </button>
  );
}

function DeleteButton({ row }: { row: InventoryRow }) {
  return (
    <form action={deleteItemAction}>
      <input type="hidden" name="id" value={row.itemId} />
      <input type="hidden" name="furnitureId" value={row.furnitureId} />
      <SubmitButton className="text-xs font-caption text-red-600 hover:underline" pendingChildren="刪除緊…">
        刪除
      </SubmitButton>
    </form>
  );
}

export function InventoryItemRow({ row, rooms, furniture, drawers }: RowProps) {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  return (
    <li className="flex flex-col gap-1.5 rounded-md border border-border bg-surface p-3.5">
      <div className="flex items-center gap-2">
        <span className="flex-1 font-medium text-ink">{row.itemName}</span>
        {isEditingQuantity ? (
          <QuantityEditor row={row} onDone={() => setIsEditingQuantity(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingQuantity(true)}
            className="text-sm font-caption text-ink-muted underline decoration-dotted hover:text-accent"
            aria-label={`編輯${row.itemName}數量`}
          >
            × {row.quantity}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-mist px-2 py-0.5 text-xs font-caption text-ink-muted">
          {row.categoryName ?? "—"}
        </span>
        {row.expiryDate ? (
          <ExpiryBadge expiryDate={row.expiryDate} />
        ) : (
          <span className="text-xs font-caption text-ink-faint">—</span>
        )}
      </div>

      {isEditingLocation ? (
        <LocationEditor row={row} rooms={rooms} furniture={furniture} drawers={drawers} onDone={() => setIsEditingLocation(false)} />
      ) : (
        <LocationLabel row={row} onEdit={() => setIsEditingLocation(true)} />
      )}

      <div className="flex justify-end">
        <DeleteButton row={row} />
      </div>
    </li>
  );
}

export function InventoryItemTableRow({ row, rooms, furniture, drawers }: RowProps) {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2 font-medium text-ink">{row.itemName}</td>
      <td className="px-4 py-2 font-caption text-ink-muted">
        {isEditingQuantity ? (
          <QuantityEditor row={row} onDone={() => setIsEditingQuantity(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingQuantity(true)}
            className="underline decoration-dotted hover:text-accent"
            aria-label={`編輯${row.itemName}數量`}
          >
            {row.quantity}
          </button>
        )}
      </td>
      <td className="px-4 py-2 font-caption text-ink-muted">{row.categoryName ?? "—"}</td>
      <td className="px-4 py-2 font-caption text-ink-muted">
        {isEditingLocation ? (
          <LocationEditor row={row} rooms={rooms} furniture={furniture} drawers={drawers} onDone={() => setIsEditingLocation(false)} />
        ) : (
          <LocationLabel row={row} onEdit={() => setIsEditingLocation(true)} />
        )}
      </td>
      <td className="px-4 py-2">
        <ExpiryBadge expiryDate={row.expiryDate} />
        {!row.expiryDate && <span className="font-caption text-ink-faint">—</span>}
      </td>
      <td className="px-4 py-2">
        <DeleteButton row={row} />
      </td>
    </tr>
  );
}
