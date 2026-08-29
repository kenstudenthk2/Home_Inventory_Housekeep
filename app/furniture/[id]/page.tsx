import Link from "next/link";
import { notFound } from "next/navigation";
import { getFurniture } from "@/lib/db/furniture";
import { listItemsInFurniture } from "@/lib/db/items";
import { listCategories } from "@/lib/db/libraries";
import { createItemAction } from "@/app/actions/items";
import { ItemForm } from "@/components/ItemForm";
import { ItemRow } from "@/components/ItemRow";
import { FurnitureIcon } from "@/components/FurnitureIcon";

export const dynamic = "force-dynamic";

export default async function FurniturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const furnitureId = Number(id);
  const furniture = await getFurniture(furnitureId);
  if (!furniture) notFound();

  const [items, categories] = await Promise.all([
    listItemsInFurniture(furnitureId),
    listCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/rooms/${furniture.roomId}`} className="text-sm font-caption text-ink-muted hover:underline">
          ← 返回 {furniture.roomName}
        </Link>
        <h1 className="mt-1 flex items-center gap-2 font-heading text-xl font-extrabold text-ink">
          <FurnitureIcon iconKey={furniture.iconKey} className="h-6 w-6 text-ink-muted" />
          {furniture.displayName}
        </h1>
      </div>

      <section>
        <h2 className="mb-2 font-heading font-semibold text-ink">物品({items.length})</h2>
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center font-caption text-ink-faint">
            仲未有物品。
          </p>
        ) : (
          <ul className="rounded-md border border-border bg-surface px-4">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} furnitureId={furnitureId} />
            ))}
          </ul>
        )}
      </section>

      <ItemForm
        furnitureId={furnitureId}
        categories={categories}
        action={createItemAction}
        submitLabel="新增物品"
      />
    </div>
  );
}
