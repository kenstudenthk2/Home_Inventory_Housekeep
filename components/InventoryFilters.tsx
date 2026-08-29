"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Category } from "@/lib/db/types";
import type { RoomSummary } from "@/lib/db/rooms";

const EXPIRY_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "expired", label: "已過期" },
  { value: "expiring_soon", label: "快到期" },
  { value: "no_expiry", label: "無到期日" },
];

const SORT_OPTIONS = [
  { value: "name", label: "名稱" },
  { value: "quantity", label: "數量(多至少)" },
  { value: "expiry", label: "到期日(近至遠)" },
  { value: "room", label: "房間位置" },
];

export function InventoryFilters({
  rooms,
  categories,
  current,
}: {
  rooms: RoomSummary[];
  categories: Category[];
  current: {
    search: string;
    roomId: string;
    categoryId: string;
    expiryStatus: string;
    sort: string;
  };
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <form
      action="/items"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="search" className="text-sm font-caption font-medium text-ink-muted">
            搜尋
          </label>
          <input
            id="search"
            name="search"
            type="search"
            defaultValue={current.search}
            placeholder="物品名稱…"
            className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex h-11 items-center gap-1.5 rounded-sm border border-border bg-surface px-3 text-sm font-caption text-ink-muted sm:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          篩選
        </button>
      </div>

      <div
        className={`flex-col gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-end ${filtersOpen ? "flex" : "hidden"}`}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="roomId" className="text-sm font-caption font-medium text-ink-muted">
            房間
          </label>
          <select
            id="roomId"
            name="roomId"
            defaultValue={current.roomId}
            className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          >
            <option value="">全部房間</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="categoryId" className="text-sm font-caption font-medium text-ink-muted">
            分類
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={current.categoryId}
            className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          >
            <option value="">全部分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="expiryStatus" className="text-sm font-caption font-medium text-ink-muted">
            到期狀態
          </label>
          <select
            id="expiryStatus"
            name="expiryStatus"
            defaultValue={current.expiryStatus || "all"}
            className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          >
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sort" className="text-sm font-caption font-medium text-ink-muted">
            排序
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={current.sort || "name"}
            className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="h-11 w-full rounded-sm bg-accent px-4 text-sm font-caption font-semibold text-white hover:bg-accent-light sm:w-auto"
        >
          套用
        </button>
        <a
          href="/items"
          className="px-2 py-2 text-center text-sm font-caption text-ink-muted hover:underline"
        >
          清除
        </a>
      </div>
    </form>
  );
}
