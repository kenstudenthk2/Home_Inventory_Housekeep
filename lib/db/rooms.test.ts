import { describe, it, expect, afterEach } from "vitest";
import { listRooms, getRoom, createRoom, updateRoom, deleteRoom } from "./rooms";
import { listRoomTypes } from "./libraries";

const created: number[] = [];
afterEach(async () => {
  await Promise.all(created.splice(0).map((id) => deleteRoom(id).catch(() => {})));
});

async function makeRoom(name: string, extra = {}) {
  const room = await createRoom({ name, ...extra });
  created.push(room.id);
  return room;
}

describe("rooms", () => {
  it("creates a room with just a name", async () => {
    const room = await makeRoom(`房間-${Date.now()}`);
    expect(room.id).toBeGreaterThan(0);
    expect(room.roomTypeId).toBeNull();
    expect(room.widthCm).toBeNull();
  });

  it("creates a room with a type and dimensions", async () => {
    const bedroom = (await listRoomTypes()).find((t) => t.key === "bedroom")!;
    const room = await makeRoom(`主人房-${Date.now()}`, {
      roomTypeId: bedroom.id,
      widthCm: 350,
      lengthCm: 420.5,
    });
    expect(room.roomTypeId).toBe(bedroom.id);
    expect(room.roomTypeLabel).toBe("睡房");
    expect(room.widthCm).toBe(350);
    expect(room.lengthCm).toBe(420.5);
  });

  it("rejects a blank name", async () => {
    await expect(createRoom({ name: "   " })).rejects.toThrow(/名稱/);
  });

  it("rejects a non-positive dimension", async () => {
    await expect(createRoom({ name: "壞尺寸", widthCm: 0 })).rejects.toThrow(/尺寸/);
    await expect(createRoom({ name: "壞尺寸", lengthCm: -5 })).rejects.toThrow(/尺寸/);
  });

  it("reads a room back by id", async () => {
    const room = await makeRoom(`讀取-${Date.now()}`);
    expect((await getRoom(room.id))!.name).toBe(room.name);
  });

  it("returns null for an unknown id", async () => {
    expect(await getRoom(999999)).toBeNull();
  });

  it("updates name and dimensions", async () => {
    const room = await makeRoom(`更新前-${Date.now()}`);
    const updated = await updateRoom(room.id, { name: "更新後", widthCm: 200 });
    expect(updated.name).toBe("更新後");
    expect(updated.widthCm).toBe(200);
  });

  it("includes furniture and item counts in the list", async () => {
    const room = await makeRoom(`計數-${Date.now()}`);
    const summary = (await listRooms()).find((r) => r.id === room.id)!;
    expect(summary.furnitureCount).toBe(0);
    expect(summary.itemCount).toBe(0);
  });

  it("deletes a room", async () => {
    const room = await createRoom({ name: `刪除-${Date.now()}` });
    await deleteRoom(room.id);
    expect(await getRoom(room.id)).toBeNull();
  });
});
