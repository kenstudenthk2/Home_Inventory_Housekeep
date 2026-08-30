"use client";

import { useMemo, useState } from "react";
import { SearchableSelect } from "./SearchableSelect";
import { SubmitButton } from "./SubmitButton";
import type { Category, Drawer, Item } from "@/lib/db/types";

export function ItemNameComboBox({
  suggestions,
  defaultValue,
  inputId,
}: {
  suggestions: string[];
  defaultValue: string;
  inputId: string;
}) {
  const [text, setText] = useState(defaultValue);

  const matches = useMemo(() => {
    const query = text.trim().toLowerCase();
    if (!query) return suggestions;
    return suggestions.filter((s) => s.toLowerCase().includes(query));
  }, [suggestions, text]);

  return (
    <>
      <input
        id={inputId}
        name="name"
        required
        autoComplete="off"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例如:AA 電芯"
        className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
      />
      <ul role="listbox" className="max-h-48 overflow-y-auto rounded-sm border border-border">
        {matches.map((s) => (
          <li key={s}>
            <button
              type="button"
              role="option"
              aria-selected={text === s}
              onClick={() => setText(s)}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface-mist"
            >
              {s}
            </button>
          </li>
        ))}
        {matches.length === 0 && (
          <li className="px-3 py-1.5 text-sm font-caption text-ink-faint">冇符合嘅選項,可以直接輸入新增</li>
        )}
      </ul>
    </>
  );
}

export function ItemForm({
  furnitureId,
  drawers,
  defaultDrawerId,
  categories,
  itemNamesByCategoryId,
  item,
  action,
  submitLabel,
}: {
  furnitureId: number;
  drawers: Drawer[];
  /** Preselect a drawer on the create form (e.g. the one currently being viewed). Ignored when editing an existing item. */
  defaultDrawerId?: number | null;
  categories: Category[];
  itemNamesByCategoryId: Record<number, string[]>;
  item?: Item;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(item?.categoryId ?? null);
  const nameInputId = `name-${item?.id ?? "new"}`;
  const drawerInputId = `drawerId-${item?.id ?? "new"}`;

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <input type="hidden" name="furnitureId" value={furnitureId} />
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="flex flex-col gap-3 sm:flex-row">
        {drawers.length > 0 && (
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={drawerInputId} className="text-sm font-caption font-medium text-ink-muted">
              擺喺邊個櫃桶
            </label>
            <select
              id={drawerInputId}
              name="drawerId"
              required
              defaultValue={item?.drawerId ?? defaultDrawerId ?? ""}
              className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
            >
              <option value="" disabled>
                揀一個櫃桶…
              </option>
              {drawers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1">
          <SearchableSelect
            name="category"
            label="分類(選填)"
            placeholder="輸入或揀一個分類…"
            allowCreate
            defaultValue={item?.categoryName ?? ""}
            options={categories.map((c) => ({ id: c.id, label: c.name }))}
            onSelectChange={setSelectedCategoryId}
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={nameInputId} className="text-sm font-caption font-medium text-ink-muted">
            物品名稱
          </label>
          {selectedCategoryId != null ? (
            <ItemNameComboBox
              inputId={nameInputId}
              defaultValue={item?.name ?? ""}
              suggestions={itemNamesByCategoryId[selectedCategoryId] ?? []}
            />
          ) : (
            <input
              id={nameInputId}
              name="name"
              required
              defaultValue={item?.name ?? ""}
              placeholder="例如:AA 電芯"
              className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`quantity-${item?.id ?? "new"}`}
            className="text-sm font-caption font-medium text-ink-muted"
          >
            數量
          </label>
          <input
            id={`quantity-${item?.id ?? "new"}`}
            name="quantity"
            type="number"
            min="1"
            step="1"
            defaultValue={item?.quantity ?? 1}
            className="w-full rounded-sm border border-border-input px-3 py-2 text-base sm:w-24 sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`expiryDate-${item?.id ?? "new"}`}
            className="text-sm font-caption font-medium text-ink-muted"
          >
            到期日(選填)
          </label>
          <input
            id={`expiryDate-${item?.id ?? "new"}`}
            name="expiryDate"
            type="date"
            defaultValue={item?.expiryDate ?? ""}
            className="w-full rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          />
        </div>
      </div>

      <SubmitButton
        className="h-11 w-full rounded-sm bg-accent px-4 text-sm font-caption font-semibold text-white hover:bg-accent-light"
        pendingChildren="處理緊…"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
