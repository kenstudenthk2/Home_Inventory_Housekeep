import { SearchableSelect } from "./SearchableSelect";
import type { Category, Item } from "@/lib/db/types";

export function ItemForm({
  furnitureId,
  categories,
  item,
  action,
  submitLabel,
}: {
  furnitureId: number;
  categories: Category[];
  item?: Item;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <input type="hidden" name="furnitureId" value={furnitureId} />
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor={`name-${item?.id ?? "new"}`} className="text-sm font-medium text-slate-700">
          物品名稱
        </label>
        <input
          id={`name-${item?.id ?? "new"}`}
          name="name"
          required
          defaultValue={item?.name ?? ""}
          placeholder="例如:AA 電芯"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <SearchableSelect
        name="category"
        label="分類(選填)"
        placeholder="輸入或揀一個分類…"
        allowCreate
        defaultValue={item?.categoryName ?? ""}
        options={categories.map((c) => ({ id: c.id, label: c.name }))}
      />

      <div className="flex gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`quantity-${item?.id ?? "new"}`}
            className="text-sm font-medium text-slate-700"
          >
            數量
          </label>
          <input
            id={`quantity-${item?.id ?? "new"}`}
            name="quantity"
            type="number"
            min="1"
            step="1"
            defaultValue={item?.quantity ?? 1}
            className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`expiryDate-${item?.id ?? "new"}`}
            className="text-sm font-medium text-slate-700"
          >
            到期日(選填)
          </label>
          <input
            id={`expiryDate-${item?.id ?? "new"}`}
            name="expiryDate"
            type="date"
            defaultValue={item?.expiryDate ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
        {submitLabel}
      </button>
    </form>
  );
}
