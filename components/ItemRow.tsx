import { ExpiryBadge } from "./ExpiryBadge";
import { deleteItemAction } from "@/app/actions/items";
import type { Item } from "@/lib/db/types";

export function ItemRow({ item, furnitureId }: { item: Item; furnitureId: number }) {
  return (
    <li className="flex flex-wrap items-center gap-2 border-b border-slate-100 py-2 last:border-0">
      <span className="font-medium">{item.name}</span>
      <span className="text-sm text-slate-500">× {item.quantity}</span>
      {item.categoryName && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {item.categoryName}
        </span>
      )}
      <ExpiryBadge expiryDate={item.expiryDate} />
      <form action={deleteItemAction} className="ml-auto">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="furnitureId" value={furnitureId} />
        <button type="submit" className="text-xs text-red-600 hover:underline">
          刪除
        </button>
      </form>
    </li>
  );
}
