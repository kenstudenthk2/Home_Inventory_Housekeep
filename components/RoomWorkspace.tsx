"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { FurnitureIcon } from "./FurnitureIcon";
import { SubmitButton } from "./SubmitButton";
import { ItemRow } from "./ItemRow";
import { ItemForm } from "./ItemForm";
import { addFurnitureAction, deleteFurnitureAction } from "@/app/actions/furniture";
import { addDrawerAction, deleteDrawerAction } from "@/app/actions/drawers";
import { createItemAction } from "@/app/actions/items";
import type { Category, Drawer, Item } from "@/lib/db/types";
import type { FurnitureSummary } from "@/lib/db/furniture";

type DrawerTab = { id: number | null; name: string };

export function RoomWorkspace({
  roomId,
  furniture,
  itemsByFurnitureId,
  drawersByFurnitureId,
  categories,
  itemNamesByCategoryId,
}: {
  roomId: number;
  furniture: FurnitureSummary[];
  itemsByFurnitureId: Record<number, Item[]>;
  drawersByFurnitureId: Record<number, Drawer[]>;
  categories: Category[];
  itemNamesByCategoryId: Record<number, string[]>;
}) {
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<number | null>(
    furniture[0]?.id ?? null,
  );

  const activeFurnitureId =
    selectedFurnitureId !== null && furniture.some((f) => f.id === selectedFurnitureId)
      ? selectedFurnitureId
      : (furniture[0]?.id ?? null);
  const activeFurniture = furniture.find((f) => f.id === activeFurnitureId) ?? null;
  const activeDrawers = activeFurniture ? (drawersByFurnitureId[activeFurniture.id] ?? []) : [];
  const furnitureItems = activeFurniture ? (itemsByFurnitureId[activeFurniture.id] ?? []) : [];
  const hasDrawers = activeDrawers.length > 0;
  // Items created before this furniture had any drawer stay visible under their own section, never silently hidden.
  const hasUnfiledItems = hasDrawers && furnitureItems.some((i) => i.drawerId === null);

  const drawerSections: DrawerTab[] = hasDrawers
    ? [
        ...activeDrawers.map((d) => ({ id: d.id, name: d.name })),
        ...(hasUnfiledItems ? [{ id: null, name: "未分類" }] : []),
      ]
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="order-2 lg:order-1">
        <h2 className="mb-3 font-heading font-semibold text-ink">
          {activeFurniture ? `${activeFurniture.displayName} 嘅物品(${furnitureItems.length})` : "物品"}
        </h2>

        {activeFurniture ? (
          <>
            <form action={addDrawerAction} className="mb-4 flex items-center gap-1">
              <input type="hidden" name="furnitureId" value={activeFurniture.id} />
              <label htmlFor="drawerName" className="sr-only">
                新增櫃桶
              </label>
              <input
                id="drawerName"
                name="name"
                placeholder="新增櫃桶…"
                required
                className="w-32 rounded-full border border-border-input px-2.5 py-1 text-xs sm:w-40"
              />
              <SubmitButton
                aria-label="新增櫃桶"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white transition-[transform,background-color] duration-150 ease-out hover:bg-accent-light active:scale-[0.97] motion-reduce:transition-none"
                pendingChildren={<Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
              >
                <Plus className="h-3 w-3" aria-hidden />
              </SubmitButton>
            </form>

            {hasDrawers ? (
              <div className="mb-4 flex flex-col gap-5">
                {drawerSections.map((section) => {
                  const sectionItems = furnitureItems.filter((i) => i.drawerId === section.id);
                  return (
                    <div key={section.id ?? "unfiled"}>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-heading font-semibold text-ink">
                          {section.name}({sectionItems.length})
                        </h3>
                        {section.id !== null && (
                          <form action={deleteDrawerAction}>
                            <input type="hidden" name="id" value={section.id} />
                            <input type="hidden" name="furnitureId" value={activeFurniture.id} />
                            <SubmitButton
                              aria-label={`刪除${section.name}`}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-ink-faint hover:bg-red-50 hover:text-red-600"
                              pendingChildren={<Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
                            >
                              <X className="h-3 w-3" aria-hidden />
                            </SubmitButton>
                          </form>
                        )}
                      </div>
                      {sectionItems.length === 0 ? (
                        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm font-caption text-ink-faint">
                          仲未有物品。
                        </p>
                      ) : (
                        <ul className="rounded-md border border-border bg-surface px-4">
                          {sectionItems.map((item) => (
                            <ItemRow key={item.id} item={item} furnitureId={activeFurniture.id} />
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : furnitureItems.length === 0 ? (
              <p className="mb-4 rounded-md border border-dashed border-border p-6 text-center font-caption text-ink-faint">
                仲未有物品。
              </p>
            ) : (
              <ul className="mb-4 rounded-md border border-border bg-surface px-4">
                {furnitureItems.map((item) => (
                  <ItemRow key={item.id} item={item} furnitureId={activeFurniture.id} />
                ))}
              </ul>
            )}

            <ItemForm
              key={activeFurniture.id}
              furnitureId={activeFurniture.id}
              drawers={activeDrawers}
              defaultDrawerId={activeDrawers[0]?.id ?? null}
              categories={categories}
              itemNamesByCategoryId={itemNamesByCategoryId}
              action={createItemAction}
              submitLabel="新增物品"
            />
          </>
        ) : (
          <p className="rounded-md border border-dashed border-border p-6 text-center font-caption text-ink-faint">
            仲未有傢俬,右邊新增一件先。
          </p>
        )}
      </section>

      <section className="order-1 lg:order-2">
        <h2 className="mb-3 font-heading font-semibold text-ink">傢俬({furniture.length})</h2>

        {furniture.length > 0 && (
          <ul className="mb-4 flex flex-col gap-2">
            {furniture.map((item) => (
              <li key={item.id}>
                <div
                  className={`flex items-center justify-between rounded-md border p-3 transition-colors duration-150 ease ${
                    item.id === activeFurniture?.id
                      ? "border-accent bg-surface-mist"
                      : "border-border bg-surface"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFurnitureId(item.id)}
                    aria-pressed={item.id === activeFurniture?.id}
                    aria-label={`選擇${item.displayName}`}
                    className="flex flex-1 items-center gap-3 text-left transition-transform duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none"
                  >
                    <FurnitureIcon iconKey={item.iconKey} className="h-5 w-5 text-ink-muted" />
                    <div>
                      <p className="font-medium text-ink">{item.displayName}</p>
                      <p className="text-sm font-caption text-ink-muted">{item.itemCount} 件物品</p>
                    </div>
                  </button>
                  <form action={deleteFurnitureAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton
                      className="rounded-sm p-2 text-ink-faint hover:bg-red-50 hover:text-red-600"
                      aria-label={`刪除${item.displayName}`}
                      pendingChildren={<Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form action={addFurnitureAction} className="flex flex-col gap-2">
          <input type="hidden" name="roomId" value={roomId} />
          <div>
            <label htmlFor="furnitureTypeName" className="mb-1 block text-sm font-caption text-ink-muted">
              新增傢俬
            </label>
            <input
              id="furnitureTypeName"
              name="furnitureTypeName"
              placeholder="例如:衣櫃"
              className="w-full rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
              required
            />
          </div>
          <SubmitButton
            className="inline-flex h-11 items-center justify-center gap-1 rounded-sm bg-accent px-3 text-sm font-caption font-semibold text-white hover:bg-accent-light"
            pendingChildren={
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                新增緊…
              </>
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            新增
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
