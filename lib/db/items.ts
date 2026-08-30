import { createClient } from "@/lib/supabase/server";
import { findOrCreateCategory } from "./libraries";
import { listDrawersForFurniture } from "./drawers";
import type { Item } from "./types";

export type ItemInput = {
  furnitureId: number;
  /** Required once the target furniture has any drawers; must stay null/undefined otherwise. */
  drawerId?: number | null;
  name: string;
  quantity?: number;
  categoryId?: number | null;
  /** A typed-in category name. Takes precedence over categoryId when both are given. */
  categoryName?: string | null;
  /** ISO date string, YYYY-MM-DD. */
  expiryDate?: string | null;
};

type ItemRow = {
  id: number;
  furniture_id: number;
  drawer_id: number | null;
  category_id: number | null;
  name: string;
  quantity: number;
  expiry_date: string | null;
  categories: { name: string } | null;
  drawers: { name: string } | null;
};

const SELECT =
  "id,furniture_id,drawer_id,category_id,name,quantity,expiry_date,categories(name),drawers(name)";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function mapItem(row: ItemRow): Item {
  return {
    id: row.id,
    furnitureId: row.furniture_id,
    drawerId: row.drawer_id,
    drawerName: row.drawers?.name ?? null,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    name: row.name,
    quantity: row.quantity,
    expiryDate: row.expiry_date,
  };
}

/** A furniture piece with any drawers requires items to name one; without drawers, drawerId must stay null. */
async function resolveDrawerId(furnitureId: number, drawerId: number | null | undefined) {
  const drawers = await listDrawersForFurniture(furnitureId);
  if (drawers.length > 0 && (drawerId === null || drawerId === undefined)) {
    throw new Error("呢件傢俬有櫃桶,加物品前要揀返一個櫃桶");
  }
  return drawerId ?? null;
}

function validateName(raw: string): string {
  const name = raw.trim();
  if (name.length === 0) throw new Error("物品名稱不可以為空白");
  return name;
}

function validateQuantity(quantity: number | undefined): number {
  if (quantity === undefined) return 1;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("數量必須係大於 0 嘅整數");
  }
  return quantity;
}

function validateExpiryDate(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (!ISO_DATE.test(raw) || Number.isNaN(Date.parse(raw))) {
    throw new Error("日期格式不正確,應為 YYYY-MM-DD");
  }
  return raw;
}

/** A typed-in name always wins over a previously selected id. */
async function resolveCategoryId(input: Pick<ItemInput, "categoryId" | "categoryName">) {
  if (input.categoryName?.trim()) {
    return (await findOrCreateCategory(input.categoryName)).id;
  }
  return input.categoryId ?? null;
}

export async function listItemsInFurniture(
  furnitureId: number,
  drawerId?: number | null,
): Promise<Item[]> {
  const supabase = createClient();
  let query = supabase.from("items").select(SELECT).eq("furniture_id", furnitureId);
  if (drawerId !== undefined) {
    query = drawerId === null ? query.is("drawer_id", null) : query.eq("drawer_id", drawerId);
  }
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw new Error(`讀取物品失敗:${error.message}`);
  return (data as unknown as ItemRow[]).map(mapItem);
}

export async function listItemsInRoom(roomId: number): Promise<Item[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .select(`${SELECT},furniture!inner(room_id)`)
    .eq("furniture.room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`讀取物品失敗:${error.message}`);
  return (data as unknown as ItemRow[]).map(mapItem);
}

export async function createItem(input: ItemInput): Promise<Item> {
  const payload = {
    furniture_id: input.furnitureId,
    drawer_id: await resolveDrawerId(input.furnitureId, input.drawerId),
    name: validateName(input.name),
    quantity: validateQuantity(input.quantity),
    expiry_date: validateExpiryDate(input.expiryDate),
    category_id: await resolveCategoryId(input),
  };

  const supabase = createClient();
  const { data, error } = await supabase.from("items").insert(payload).select(SELECT).single();
  if (error) throw new Error(`新增物品失敗:${error.message}`);
  return mapItem(data as unknown as ItemRow);
}

export async function updateItem(
  id: number,
  furnitureId: number,
  input: Omit<ItemInput, "furnitureId">,
): Promise<Item> {
  const payload = {
    drawer_id: await resolveDrawerId(furnitureId, input.drawerId),
    name: validateName(input.name),
    quantity: validateQuantity(input.quantity),
    expiry_date: validateExpiryDate(input.expiryDate),
    category_id: await resolveCategoryId(input),
  };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .update(payload)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(`更新物品失敗:${error.message}`);
  return mapItem(data as unknown as ItemRow);
}

/** Existing item names grouped by category, for the add-item name combobox (trimmed, deduped case-insensitively). */
export async function groupItemNamesByCategoryId(): Promise<Record<number, string[]>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .select("category_id,name")
    .not("category_id", "is", null);
  if (error) throw new Error(`讀取物品名稱建議失敗:${error.message}`);

  const namesByCategoryId = new Map<number, Map<string, string>>();
  for (const row of data as unknown as { category_id: number; name: string }[]) {
    const trimmedName = row.name.trim();
    const key = trimmedName.toLowerCase();
    const names = namesByCategoryId.get(row.category_id) ?? new Map<string, string>();
    if (!names.has(key)) names.set(key, trimmedName);
    namesByCategoryId.set(row.category_id, names);
  }

  return Object.fromEntries(
    Array.from(namesByCategoryId.entries()).map(([categoryId, names]) => [
      categoryId,
      Array.from(names.values()).sort((a, b) => a.localeCompare(b, "zh-Hant")),
    ]),
  );
}

export type RoomItemSummary = { name: string; totalQuantity: number };

/** Combines same-named items across every piece of furniture in a room (e.g. two boxes each holding USB cables). */
export async function getRoomItemSummary(roomId: number): Promise<RoomItemSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .select("name,quantity,furniture!inner(room_id)")
    .eq("furniture.room_id", roomId);
  if (error) throw new Error(`讀取物品總覽失敗:${error.message}`);

  const totals = new Map<string, RoomItemSummary>();
  for (const row of data as unknown as { name: string; quantity: number }[]) {
    const trimmedName = row.name.trim();
    const key = trimmedName.toLowerCase();
    const existing = totals.get(key);
    if (existing) {
      existing.totalQuantity += row.quantity;
    } else {
      totals.set(key, { name: trimmedName, totalQuantity: row.quantity });
    }
  }
  return Array.from(totals.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
}

export async function deleteItem(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw new Error(`刪除物品失敗:${error.message}`);
}
