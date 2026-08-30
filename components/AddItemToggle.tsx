"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { QuickAddItemForm } from "./QuickAddItemForm";
import type { Category, Drawer, Furniture } from "@/lib/db/types";
import type { RoomSummary } from "@/lib/db/rooms";

export function AddItemToggle({
  rooms,
  furniture,
  drawers,
  categories,
  itemNamesByCategoryId,
}: {
  rooms: RoomSummary[];
  furniture: Furniture[];
  drawers: Drawer[];
  categories: Category[];
  itemNamesByCategoryId: Record<number, string[]>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) {
    return (
      <QuickAddItemForm
        rooms={rooms}
        furniture={furniture}
        drawers={drawers}
        categories={categories}
        itemNamesByCategoryId={itemNamesByCategoryId}
        onDone={() => setIsOpen(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="inline-flex h-11 items-center justify-center gap-1 self-start rounded-sm bg-accent px-4 text-sm font-caption font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-accent-light active:scale-[0.97] motion-reduce:transition-none"
    >
      <Plus className="h-4 w-4" aria-hidden />
      新增物品
    </button>
  );
}
