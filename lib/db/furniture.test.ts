import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRoom, deleteRoom } from "./rooms";
import { listFurnitureTypes, findOrCreateFurnitureType } from "./libraries";
import {
  listFurnitureInRoom,
  getFurniture,
  addFurnitureToRoom,
  addFurnitureByName,
  deleteFurniture,
} from "./furniture";

let roomId: number;

beforeAll(async () => {
  roomId = (await createRoom({ name: `傢俬測試房-${Date.now()}` })).id;
});
afterAll(async () => {
  await deleteRoom(roomId);
});

describe("furniture", () => {
  it("adds a furniture instance by type id", async () => {
    const bed = (await listFurnitureTypes("床")).find((t) => t.name === "床")!;
    const f = await addFurnitureToRoom(roomId, bed.id);
    expect(f.roomId).toBe(roomId);
    expect(f.displayName).toBe("床");
    expect(f.iconKey).toBe("bed");
  });

  it("uses the custom name as the display name when given", async () => {
    const wardrobe = (await listFurnitureTypes("衣櫃"))[0];
    const f = await addFurnitureToRoom(roomId, wardrobe.id, "左邊衣櫃");
    expect(f.displayName).toBe("左邊衣櫃");
  });

  it("creates the type in the shared library when adding by a new name", async () => {
    const name = `自訂酒櫃-${Date.now()}`;
    const f = await addFurnitureByName(roomId, name, "cabinet");
    expect(f.displayName).toBe(name);

    // The point of the shared library: it is now offered everywhere.
    expect((await listFurnitureTypes(name)).map((t) => t.id)).toContain(f.furnitureTypeId);
  });

  it("reuses an existing type instead of duplicating it", async () => {
    const name = `重用櫃-${Date.now()}`;
    const existing = await findOrCreateFurnitureType(name, "cabinet");
    const f = await addFurnitureByName(roomId, name);
    expect(f.furnitureTypeId).toBe(existing.id);
  });

  it("rejects a blank type name", async () => {
    await expect(addFurnitureByName(roomId, "  ")).rejects.toThrow(/名稱/);
  });

  it("lists furniture in the room with item counts", async () => {
    const list = await listFurnitureInRoom(roomId);
    expect(list.length).toBeGreaterThanOrEqual(4);
    expect(list.every((f) => f.itemCount === 0)).toBe(true);
  });

  it("reads a furniture piece back with its room name", async () => {
    const [first] = await listFurnitureInRoom(roomId);
    const loaded = await getFurniture(first.id);
    expect(loaded!.roomId).toBe(roomId);
    expect(loaded!.roomName).toContain("傢俬測試房");
  });

  it("returns null for an unknown furniture id", async () => {
    expect(await getFurniture(999999)).toBeNull();
  });

  it("deletes a furniture piece", async () => {
    const box = (await listFurnitureTypes("儲物箱"))[0];
    const f = await addFurnitureToRoom(roomId, box.id);
    await deleteFurniture(f.id);
    expect(await getFurniture(f.id)).toBeNull();
  });
});
