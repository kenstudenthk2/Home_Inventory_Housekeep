import { createClient } from "@/lib/supabase/server";
import type { Drawer } from "./types";

type DrawerRow = {
  id: number;
  furniture_id: number;
  name: string;
  sort_order: number;
};

const SELECT = "id,furniture_id,name,sort_order";

function mapDrawer(row: DrawerRow): Drawer {
  return {
    id: row.id,
    furnitureId: row.furniture_id,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

function validateName(raw: string): string {
  const name = raw.trim();
  if (name.length === 0) throw new Error("櫃桶名稱不可以為空白");
  return name;
}

export async function listDrawersForFurniture(furnitureId: number): Promise<Drawer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("drawers")
    .select(SELECT)
    .eq("furniture_id", furnitureId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`讀取櫃桶失敗:${error.message}`);
  return (data as unknown as DrawerRow[]).map(mapDrawer);
}

export async function listDrawersInRoom(roomId: number): Promise<Drawer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("drawers")
    .select(`${SELECT},furniture!inner(room_id)`)
    .eq("furniture.room_id", roomId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`讀取櫃桶失敗:${error.message}`);
  return (data as unknown as DrawerRow[]).map(mapDrawer);
}

export async function addDrawer(furnitureId: number, name: string): Promise<Drawer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("drawers")
    .insert({ furniture_id: furnitureId, name: validateName(name) })
    .select(SELECT)
    .single();
  if (error) throw new Error(`新增櫃桶失敗:${error.message}`);
  return mapDrawer(data as unknown as DrawerRow);
}

export async function renameDrawer(id: number, name: string): Promise<Drawer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("drawers")
    .update({ name: validateName(name) })
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(`更新櫃桶失敗:${error.message}`);
  return mapDrawer(data as unknown as DrawerRow);
}

export async function deleteDrawer(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("drawers").delete().eq("id", id);
  if (error) throw new Error(`刪除櫃桶失敗:${error.message}`);
}
