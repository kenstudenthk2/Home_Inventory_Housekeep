"use client";

import { useState } from "react";
import { ItemNameComboBox } from "./ItemForm";
import { LocationPicker } from "./LocationPicker";
import { SearchableSelect } from "./SearchableSelect";
import { SubmitButton } from "./SubmitButton";
import { createItemAction } from "@/app/actions/items";
import type { Category, Drawer, Furniture } from "@/lib/db/types";
import type { RoomSummary } from "@/lib/db/rooms";

export function QuickAddItemForm({
  rooms,
  furniture,
  drawers,
  categories,
  itemNamesByCategoryId,
  onDone,
}: {
  rooms: RoomSummary[];
  furniture: Furniture[];
  drawers: Drawer[];
  categories: Category[];
  itemNamesByCategoryId: Record<number, string[]>;
  onDone: () => void;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  async function handleSubmit(formData: FormData) {
    await createItemAction(formData);
    onDone();
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <LocationPicker rooms={rooms} furniture={furniture} drawers={drawers} idPrefix="quick-add" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchableSelect
            name="category"
            label="分類(選填)"
            placeholder="輸入或揀一個分類…"
            allowCreate
            options={categories.map((c) => ({ id: c.id, label: c.name }))}
            onSelectChange={setSelectedCategoryId}
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="quick-add-name" className="text-sm font-caption font-medium text-ink-muted">
            物品名稱
          </label>
          {selectedCategoryId != null ? (
            <ItemNameComboBox
              inputId="quick-add-name"
              defaultValue=""
              suggestions={itemNamesByCategoryId[selectedCategoryId] ?? []}
            />
          ) : (
            <input
              id="quick-add-name"
              name="name"
              required
              placeholder="例如:AA 電芯"
              className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-col gap-1">
          <label htmlFor="quick-add-quantity" className="text-sm font-caption font-medium text-ink-muted">
            數量
          </label>
          <input
            id="quick-add-quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            defaultValue={1}
            className="w-full rounded-sm border border-border-input px-3 py-2 text-base sm:w-24 sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="quick-add-expiry" className="text-sm font-caption font-medium text-ink-muted">
            到期日(選填)
          </label>
          <input
            id="quick-add-expiry"
            name="expiryDate"
            type="date"
            className="w-full rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <SubmitButton
          className="h-11 flex-1 rounded-sm bg-accent px-4 text-sm font-caption font-semibold text-white hover:bg-accent-light"
          pendingChildren="新增緊…"
        >
          新增物品
        </SubmitButton>
        <button
          type="button"
          onClick={onDone}
          className="h-11 rounded-sm border border-border px-4 text-sm font-caption text-ink-muted hover:bg-surface-mist"
        >
          取消
        </button>
      </div>
    </form>
  );
}
