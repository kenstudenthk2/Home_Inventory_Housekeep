import { ExpiryBadge } from "./ExpiryBadge";
import { SubmitButton } from "./SubmitButton";
import { deleteItemAction } from "@/app/actions/items";
import type { Item } from "@/lib/db/types";

export function ItemRow({ item, furnitureId }: { item: Item; furnitureId: number }) {
  return (
    <li className="flex flex-wrap items-center gap-2 border-b border-border py-2 last:border-0">
      <span className="font-medium text-ink">{item.name}</span>
      <span className="text-sm font-caption text-ink-muted">× {item.quantity}</span>
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
