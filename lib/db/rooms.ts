import { createClient } from "@/lib/supabase/server";
import type { Room } from "./types";

export type RoomInput = {
  name: string;
  roomTypeId?: number | null;
  widthCm?: number | null;
  lengthCm?: number | null;
};

export type RoomSummary = Room & { furnitureCount: number; itemCount: number };

type RoomRow = {
  id: number;
  name: string;
  room_type_id: number | null;
  width_cm: string | number | null;
  length_cm: string | number | null;
  room_types: { label: string } | null;
};

const SELECT = "id,name,room_type_id,width_cm,length_cm,room_types(label)";

/** Postgres numeric arrives as a string over the wire; normalise to number|null. */
function toNumber(value: string | number | null): number | null {
  return value === null ? null : Number(value);
}

function mapRoom(row: RoomRow): Room {
  return {
    id: row.id,
    name: row.name,
    roomTypeId: row.room_type_id,
    roomTypeLabel: row.room_types?.label ?? null,
    widthCm: toNumber(row.width_cm),
    lengthCm: toNumber(row.length_cm),
  };
}

function validate(input: RoomInput) {
  const name = input.name.trim();
  if (name.length === 0) throw new Error("房間名稱不可以為空白");
  for (const dimension of [input.widthCm, input.lengthCm]) {
    if (dimension !== null && dimension !== undefined && !(dimension > 0)) {
      throw new Error("房間尺寸必須大於 0");
    }
  }
  return {
    name,
    room_type_id: input.roomTypeId ?? null,
    width_cm: input.widthCm ?? null,
    length_cm: input.lengthCm ?? null,
  };
}

export async function listRooms(): Promise<RoomSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(`${SELECT},furniture(id,items(id))`)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`讀取房間失敗:${error.message}`);

  return (data as unknown as (RoomRow & { furniture: { id: number; items: { id: number }[] }[] })[])
    .map((row) => ({
      ...mapRoom(row),
      furnitureCount: row.furniture.length,
      itemCount: row.furniture.reduce((sum, f) => sum + f.items.length, 0),
    }));
}

export async function getRoom(id: number): Promise<Room | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("rooms").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`讀取房間失敗:${error.message}`);
  return data ? mapRoom(data as unknown as RoomRow) : null;
}

export async function createRoom(input: RoomInput): Promise<Room> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .insert(validate(input))
    .select(SELECT)
    .single();
  if (error) throw new Error(`新增房間失敗:${error.message}`);
  return mapRoom(data as unknown as RoomRow);
}

export async function updateRoom(id: number, input: RoomInput): Promise<Room> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .update(validate(input))
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(`更新房間失敗:${error.message}`);
  return mapRoom(data as unknown as RoomRow);
}

export async function deleteRoom(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) throw new Error(`刪除房間失敗:${error.message}`);
}
