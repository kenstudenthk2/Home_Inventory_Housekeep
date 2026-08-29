"use client";

import Link from "next/link";
import { useState } from "react";
import { Home, Search } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { Room } from "@/lib/db/types";

export function AppHeader({ rooms }: { rooms: Pick<Room, "id" | "name">[] }) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="border-b border-border bg-surface">
      <div className="flex items-center gap-4 px-4 py-3 lg:px-8">
        <Sidebar rooms={rooms} />

        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-ink">
          <Home className="h-5 w-5" aria-hidden />
          <span className="hidden sm:inline">家居物品管理</span>
          <span className="sm:hidden">家居物品</span>
        </Link>

        <div className="flex-1" />

        <form action="/items" className="hidden items-center gap-2 sm:flex">
          <label htmlFor="global-search" className="sr-only">
            搜尋物品
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden
            />
            <input
              id="global-search"
              name="search"
              type="search"
              placeholder="搜尋物品…"
              className="w-56 rounded-sm border border-border-input py-1.5 pl-8 pr-3 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-sm bg-accent px-3 py-1.5 text-sm font-caption font-semibold text-white hover:bg-accent-light"
          >
            搜尋
          </button>
        </form>

        <Link href="/items" className="hidden text-sm font-caption text-ink-muted hover:text-ink sm:block">
          全部物品
        </Link>

        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            aria-label="搜尋"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-sm bg-bg text-ink-muted"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <form action="/items" className="border-t border-border px-4 py-3 sm:hidden">
          <label htmlFor="global-search-mobile" className="sr-only">
            搜尋物品
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden
            />
            <input
              id="global-search-mobile"
              name="search"
              type="search"
              placeholder="搜尋物品…"
              autoFocus
              className="w-full rounded-sm border border-border-input py-2 pl-8 pr-3 text-base"
            />
          </div>
        </form>
      )}
    </header>
  );
}
