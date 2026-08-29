"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { RoomItemSummary as RoomItemSummaryItem } from "@/lib/db/items";

export function RoomItemSummary({ items }: { items: RoomItemSummaryItem[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center gap-1 font-heading font-semibold text-ink"
        aria-expanded={isExpanded}
      >
        物品總覽({items.length})
        {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
      </button>

      {isExpanded && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item.name.toLowerCase()}
              className="rounded-full bg-surface-mist px-3 py-1 text-sm font-caption text-ink"
            >
              {item.name} × {item.totalQuantity}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
