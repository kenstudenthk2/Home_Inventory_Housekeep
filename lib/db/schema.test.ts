import { describe, it, expect } from "vitest";
import { createClient } from "@/lib/supabase/server";

const supabase = createClient();

describe("schema", () => {
  it("has seeded room types", async () => {
    const { data, error } = await supabase.from("room_types").select("key,label");
    expect(error).toBeNull();
    expect(data!.map((r) => r.key)).toEqual(
      expect.arrayContaining(["bedroom", "kitchen", "living_room", "bathroom", "storage"]),
    );
  });

  it("suggests furniture for a bedroom", async () => {
    const { data, error } = await supabase
      .from("room_types")
      .select("key, room_type_default_furniture(furniture_types(name))")
      .eq("key", "bedroom")
      .single();
    expect(error).toBeNull();
    const names = data!.room_type_default_furniture.map(
      (d: { furniture_types: { name: string } }) => d.furniture_types.name,
    );
    expect(names).toEqual(expect.arrayContaining(["床", "衣櫃", "床頭櫃"]));
  });

  it("deduplicates furniture types case-insensitively via the RPC", async () => {
    const a = await supabase
      .rpc("find_or_create_furniture_type", { p_name: "測試酒櫃", p_icon_key: "cabinet" })
      .single();
    const b = await supabase
      .rpc("find_or_create_furniture_type", { p_name: "  測試酒櫃  ", p_icon_key: "cabinet" })
      .single();
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    expect(b.data!.id).toBe(a.data!.id);
  });

  it("rejects a non-positive item quantity", async () => {
    const room = await supabase.from("rooms").insert({ name: "臨時房" }).select().single();
    const ft = await supabase
      .rpc("find_or_create_furniture_type", { p_name: "臨時櫃", p_icon_key: "cabinet" })
      .single();
    const f = await supabase
      .from("furniture")
      .insert({ room_id: room.data!.id, furniture_type_id: ft.data!.id })
      .select()
      .single();

    const { error } = await supabase
      .from("items")
      .insert({ furniture_id: f.data!.id, name: "壞數量", quantity: 0 });
    expect(error).not.toBeNull();

    await supabase.from("rooms").delete().eq("id", room.data!.id);
  });

  it("cascades deletes from room to furniture to items", async () => {
    const room = await supabase.from("rooms").insert({ name: "級聯房" }).select().single();
    const ft = await supabase
      .rpc("find_or_create_furniture_type", { p_name: "級聯櫃", p_icon_key: "cabinet" })
      .single();
    const f = await supabase
      .from("furniture")
      .insert({ room_id: room.data!.id, furniture_type_id: ft.data!.id })
      .select()
      .single();
    await supabase.from("items").insert({ furniture_id: f.data!.id, name: "級聯物品", quantity: 1 });

    await supabase.from("rooms").delete().eq("id", room.data!.id);

    const remaining = await supabase.from("furniture").select("id").eq("id", f.data!.id);
    expect(remaining.data).toEqual([]);
  });
});
