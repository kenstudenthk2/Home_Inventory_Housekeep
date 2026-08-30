import { createClient } from "@/lib/supabase/server";

export type InventoryRow = {
  itemId: number;
  itemName: string;
  quantity: number;
  expiryDate: string | null;
  categoryId: number | null;
  categoryName: string | null;
  drawerId: number | null;
  drawerName: string | null;
  furnitureId: number;
  furnitureName: string;
  roomId: number;
  roomName: string;
};

export type ExpiryStatus = "all" | "expired" | "expiring_soon" | "no_expiry";
export type InventorySort = "name" | "quantity" | "expiry" | "room";

export type InventoryFilters = {
  search?: string;
  roomId?: number;
  furnitureId?: number;
  categoryId?: number;
  expiryStatus?: ExpiryStatus;
  sort?: InventorySort;
};

export const EXPIRING_SOON_DAYS = 30;

function isoDaysFromNow(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Pure classifier, exported so the UI can colour rows without a round trip. */
export function expiryStatusOf(
  expiryDate: string | null,
  today = new Date(),
): "expired" | "expiring_soon" | "ok" | "none" {
  if (!expiryDate) return "none";
  const todayIso = today.toISOString().slice(0, 10);
  if (expiryDate < todayIso) return "expired";
  if (expiryDate <= isoDaysFromNow(EXPIRING_SOON_DAYS, today)) return "expiring_soon";
  return "ok";
}

type Row = {
  id: number;
  name: string;
  quantity: number;
  expiry_date: string | null;
  category_id: number | null;
  categories: { name: string } | null;
  drawer_id: number | null;
  drawers: { name: string } | null;
  furniture: {
    id: number;
    custom_name: string | null;
    furniture_types: { name: string } | null;
    rooms: { id: number; name: string } | null;
  } | null;
};

const SELECT = `
  id,name,quantity,expiry_date,category_id,drawer_id,
  categories(name),
  drawers(name),
  furniture!inner(id,custom_name,furniture_types(name),rooms!inner(id,name))
`;

function mapRow(row: Row): InventoryRow {
  return {
    itemId: row.id,
    itemName: row.name,
    quantity: row.quantity,
    expiryDate: row.expiry_date,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    drawerId: row.drawer_id,
    drawerName: row.drawers?.name ?? null,
    furnitureId: row.furniture?.id ?? 0,
    furnitureName:
      row.furniture?.custom_name ?? row.furniture?.furniture_types?.name ?? "未命名傢俬",
    roomId: row.furniture?.rooms?.id ?? 0,
    roomName: row.furniture?.rooms?.name ?? "",
  };
}

export async function listInventory(filters: InventoryFilters = {}): Promise<InventoryRow[]> {
  const supabase = createClient();
  let query = supabase.from("items").select(SELECT);

  if (filters.search?.trim()) query = query.ilike("name", `%${filters.search.trim()}%`);
  if (filters.furnitureId) query = query.eq("furniture_id", filters.furnitureId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.roomId) query = query.eq("furniture.rooms.id", filters.roomId);

  const today = new Date().toISOString().slice(0, 10);
  switch (filters.expiryStatus) {
    case "expired":
      query = query.lt("expiry_date", today);
      break;
    case "expiring_soon":
      query = query.gte("expiry_date", today).lte("expiry_date", isoDaysFromNow(EXPIRING_SOON_DAYS));
      break;
    case "no_expiry":
      query = query.is("expiry_date", null);
      break;
    default:
      break;
  }

  const { data, error } = await query;
  if (error) throw new Error(`讀取物品清單失敗:${error.message}`);
  return sortRows((data as unknown as Row[]).map(mapRow), filters.sort ?? "name");
}

/**
 * Sorted in JS, not SQL: "room" and "furniture" live behind an embed, and
 * "expiry" needs undated rows pinned last rather than nulls-first/last on a
 * single column. The result set is one household's items — small enough that
 * an in-memory sort is the simpler correct choice.
 */
function sortRows(rows: InventoryRow[], sort: InventorySort): InventoryRow[] {
  const byName = (a: InventoryRow, b: InventoryRow) =>
    a.itemName.localeCompare(b.itemName, "zh-Hant");

  switch (sort) {
    case "quantity":
      return [...rows].sort((a, b) => b.quantity - a.quantity || byName(a, b));
    case "expiry":
      return [...rows].sort((a, b) => {
        if (a.expiryDate === null && b.expiryDate === null) return byName(a, b);
        if (a.expiryDate === null) return 1; // undated rows sink to the bottom
        if (b.expiryDate === null) return -1;
        return a.expiryDate.localeCompare(b.expiryDate) || byName(a, b);
      });
    case "room":
      return [...rows].sort(
        (a, b) =>
          a.roomName.localeCompare(b.roomName, "zh-Hant") ||
          a.furnitureName.localeCompare(b.furnitureName, "zh-Hant") ||
          byName(a, b),
      );
    default:
      return [...rows].sort(byName);
  }
}

export async function listExpiringItems(
  withinDays = EXPIRING_SOON_DAYS,
): Promise<InventoryRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .select(SELECT)
    .not("expiry_date", "is", null)
    .lte("expiry_date", isoDaysFromNow(withinDays))
    .order("expiry_date", { ascending: true });
  if (error) throw new Error(`讀取到期提醒失敗:${error.message}`);
  return (data as unknown as Row[]).map(mapRow);
}
