import { createClient } from "@/lib/supabase/server";
import type { Category, FurnitureType, RoomType } from "./types";

function requireName(raw: string): string {
  const name = raw.trim();
  if (name.length === 0) throw new Error("名稱不可以為空白");
  return name;
}

export async function listRoomTypes(): Promise<RoomType[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("room_types")
    .select("id,key,label")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`讀取房間類型失敗:${error.message}`);
  return data.map((r) => ({ id: r.id, key: r.key, label: r.label }));
}

export async function listFurnitureTypes(search?: string): Promise<FurnitureType[]> {
  const supabase = createClient();
  let query = supabase.from("furniture_types").select("id,name,icon_key");
  if (search?.trim()) query = query.ilike("name", `%${search.trim()}%`);
  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw new Error(`讀取傢俬類型失敗:${error.message}`);
  return data.map((r) => ({ id: r.id, name: r.name, iconKey: r.icon_key }));
}

export async function findOrCreateFurnitureType(
  name: string,
  iconKey = "box",
): Promise<FurnitureType> {
  const supabase = createClient();
  const { data, error } = await supabase
    .rpc("find_or_create_furniture_type", { p_name: requireName(name), p_icon_key: iconKey })
    .single();
  if (error) throw new Error(`新增傢俬類型失敗:${error.message}`);
  return { id: data.id, name: data.name, iconKey: data.icon_key };
}

export async function listCategories(search?: string): Promise<Category[]> {
  const supabase = createClient();
  let query = supabase.from("categories").select("id,name");
  if (search?.trim()) query = query.ilike("name", `%${search.trim()}%`);
  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw new Error(`讀取分類失敗:${error.message}`);
  return data.map((r) => ({ id: r.id, name: r.name }));
}

export async function findOrCreateCategory(name: string): Promise<Category> {
  const supabase = createClient();
  const { data, error } = await supabase
    .rpc("find_or_create_category", { p_name: requireName(name) })
    .single();
  if (error) throw new Error(`新增分類失敗:${error.message}`);
  return { id: data.id, name: data.name };
}

export async function listSuggestedFurnitureTypes(roomTypeId: number): Promise<FurnitureType[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("room_type_default_furniture")
    .select("furniture_types(id,name,icon_key)")
    .eq("room_type_id", roomTypeId);
  if (error) throw new Error(`讀取建議傢俬失敗:${error.message}`);
  return data
    .map((r) => r.furniture_types as unknown as { id: number; name: string; icon_key: string })
    .filter(Boolean)
    .map((t) => ({ id: t.id, name: t.name, iconKey: t.icon_key }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
}

/**
 * Suggestions for every room type at once. The room form needs the whole map
 * up front so changing the room-type dropdown updates the checkbox list
 * without a server round trip.
 */
export async function loadSuggestionMap(
  roomTypeIds: number[],
): Promise<Record<number, FurnitureType[]>> {
  const entries = await Promise.all(
    roomTypeIds.map(async (id) => [id, await listSuggestedFurnitureTypes(id)] as const),
  );
  return Object.fromEntries(entries);
}
