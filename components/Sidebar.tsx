"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, DoorOpen, ListChecks, Settings } from "lucide-react";
import type { Room } from "@/lib/db/types";

export function Sidebar({ rooms }: { rooms: Pick<Room, "id" | "name">[] }) {
  const [isOpen, setIsOpen] = useState(false);

  function close() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label="選單"
        onClick={() => setIsOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-sm bg-bg text-ink-muted"
      >
        <Menu className="h-[18px] w-[18px]" aria-hidden />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="關閉選單"
            onClick={close}
            className="absolute inset-0 bg-black/40"
          />

          <nav className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col gap-1 overflow-y-auto bg-surface p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-heading font-semibold text-ink">選單</span>
              <button
                type="button"
                aria-label="關閉選單"
                onClick={close}
                className="flex h-9 w-9 items-center justify-center rounded-sm text-ink-muted hover:bg-surface-mist"
              >
                <X className="h-[18px] w-[18px]" aria-hidden />
              </button>
            </div>

            <Link
              href="/items"
              onClick={close}
              className="flex items-center gap-2 rounded-sm px-2 py-2 text-sm font-caption text-ink hover:bg-surface-mist"
            >
              <ListChecks className="h-4 w-4 text-ink-muted" aria-hidden />
              全部物品
            </Link>

            <Link
              href="/settings"
              onClick={close}
              className="flex items-center gap-2 rounded-sm px-2 py-2 text-sm font-caption text-ink hover:bg-surface-mist"
            >
              <Settings className="h-4 w-4 text-ink-muted" aria-hidden />
              設定
            </Link>

            <p className="mt-4 mb-1 px-2 text-xs font-caption font-medium uppercase tracking-wide text-ink-faint">
              房間
            </p>
            {rooms.length === 0 ? (
              <p className="px-2 text-sm font-caption text-ink-faint">仲未有房間</p>
            ) : (
              rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/rooms/${room.id}`}
                  onClick={close}
                  className="flex items-center gap-2 rounded-sm px-2 py-2 text-sm font-caption text-ink hover:bg-surface-mist"
                >
                  <DoorOpen className="h-4 w-4 text-ink-muted" aria-hidden />
                  {room.name}
                </Link>
              ))
            )}
          </nav>
        </div>
      )}
    </>
  );
}
