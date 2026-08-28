import { createClient } from "@/lib/supabase/server";
import { findOrCreateFurnitureType } from "./libraries";
import type { Furniture } from "./types";

export type FurnitureSummary = Furniture & { itemCount: number };

type FurnitureRow = {
  id: number;
  room_id: number;
  furniture_type_id: number;
  custom_name: string | null;
  furniture_types: { name: string; icon_key: string } | null;
};

const SELECT = "id,room_id,furniture_type_id,custom_name,furniture_types(name,icon_key)";

function mapFurniture(row: FurnitureRow): Furniture {
  return {
    id: row.id,
    roomId: row.room_id,
    furnitureTypeId: row.furniture_type_id,
    customName: row.custom_name,
    displayName: row.custom_name ?? row.furniture_types?.name ?? "未命名傢俬",
    iconKey: row.furniture_types?.icon_key ?? "box",
  };
}

export async function listFurnitureInRoom(roomId: number): Promise<FurnitureSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("furniture")
    .select(`${SELECT},items(id)`)
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`讀取傢俬失敗:${error.message}`);

  return (data as unknown as (FurnitureRow & { items: { id: number }[] })[]).map((row) => ({
    ...mapFurniture(row),
    itemCount: row.items.length,
  }));
}

export async function getFurniture(
  id: number,
): Promise<(Furniture & { roomName: string }) | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("furniture")
    .select(`${SELECT},rooms(name)`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`讀取傢俬失敗:${error.message}`);
  if (!data) return null;

  const row = data as unknown as FurnitureRow & { rooms: { name: string } | null };
  return { ...mapFurniture(row), roomName: row.rooms?.name ?? "" };
}

export async function addFurnitureToRoom(
  roomId: number,
  furnitureTypeId: number,
  customName: string | null = null,
): Promise<Furniture> {
  const supabase = createClient();
  const trimmed = customName?.trim();
  const { data, error } = await supabase
    .from("furniture")
    .insert({
      room_id: roomId,
      furniture_type_id: furnitureTypeId,
      custom_name: trimmed ? trimmed : null,
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(`新增傢俬失敗:${error.message}`);
  return mapFurniture(data as unknown as FurnitureRow);
}

/**
 * Add furniture by typing a name. The name resolves through the shared global
 * library, so a name typed once here shows up in every other room's selector.
 */
export async function addFurnitureByName(
  roomId: number,
  typeName: string,
  iconKey = "box",
): Promise<Furniture> {
  const type = await findOrCreateFurnitureType(typeName, iconKey);
  return addFurnitureToRoom(roomId, type.id);
}

export async function deleteFurniture(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("furniture").delete().eq("id", id);
  if (error) throw new Error(`刪除傢俬失敗:${error.message}`);
}
