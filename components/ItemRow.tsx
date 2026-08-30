"use client";

import { useState } from "react";
import { ExpiryBadge } from "./ExpiryBadge";
import { SubmitButton } from "./SubmitButton";
import { deleteItemAction, updateItemAction } from "@/app/actions/items";
import type { Item } from "@/lib/db/types";

export function ItemRow({ item, furnitureId }: { item: Item; furnitureId: number }) {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);

  async function handleQuantitySave(formData: FormData) {
    await updateItemAction(formData);
    setIsEditingQuantity(false);
  }

  return (
    <li className="flex flex-wrap items-center gap-2 border-b border-border py-2 last:border-0">
      <span className="font-medium text-ink">{item.name}</span>

      {isEditingQuantity ? (
        <form action={handleQuantitySave} className="flex items-center gap-1">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="furnitureId" value={furnitureId} />
          <input type="hidden" name="name" value={item.name} />
          {item.categoryId != null && <input type="hidden" name="categoryId" value={item.categoryId} />}
          {item.expiryDate && <input type="hidden" name="expiryDate" value={item.expiryDate} />}
          <input
            type="number"
            name="quantity"
            min="1"
            step="1"
            defaultValue={item.quantity}
            autoFocus
            className="w-16 rounded-sm border border-border-input px-2 py-1 text-sm"
          />
          <SubmitButton className="text-xs font-caption text-accent hover:underline" pendingChildren="儲存緊…">
            儲存
          </SubmitButton>
          <button
            type="button"
            onClick={() => setIsEditingQuantity(false)}
            className="text-xs font-caption text-ink-muted transition-colors duration-150 ease hover:underline"
          >
            取消
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditingQuantity(true)}
          className="text-sm font-caption text-ink-muted underline decoration-dotted transition-colors duration-150 ease hover:text-accent"
          aria-label={`編輯${item.name}數量`}
        >
          × {item.quantity}
        </button>
      )}

      {item.categoryName && (
        <span className="rounded-full bg-surface-mist px-2 py-0.5 text-xs font-caption text-ink-muted">
          {item.categoryName}
        </span>
      )}
      <ExpiryBadge expiryDate={item.expiryDate} />
      <form action={deleteItemAction} className="ml-auto">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="furnitureId" value={furnitureId} />
        <SubmitButton className="text-xs font-caption text-red-600 hover:underline" pendingChildren="刪除緊…">
          刪除
        </SubmitButton>
      </form>
    </li>
  );
}
