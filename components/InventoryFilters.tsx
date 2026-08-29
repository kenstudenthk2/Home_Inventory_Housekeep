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
  return (
    <form
      action="/items"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="search" className="text-sm font-medium text-slate-700">
          搜尋
        </label>
        <input
          id="search"
          name="search"
          type="search"
          defaultValue={current.search}
          placeholder="物品名稱…"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="roomId" className="text-sm font-medium text-slate-700">
          房間
        </label>
        <select
          id="roomId"
          name="roomId"
          defaultValue={current.roomId}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        <label htmlFor="categoryId" className="text-sm font-medium text-slate-700">
          分類
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={current.categoryId}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        <label htmlFor="expiryStatus" className="text-sm font-medium text-slate-700">
          到期狀態
        </label>
        <select
          id="expiryStatus"
          name="expiryStatus"
          defaultValue={current.expiryStatus || "all"}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {EXPIRY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sort" className="text-sm font-medium text-slate-700">
          排序
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={current.sort || "name"}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
        套用
      </button>
      <a href="/items" className="px-2 py-2 text-sm text-slate-500 hover:underline">
        清除
      </a>
    </form>
  );
}
