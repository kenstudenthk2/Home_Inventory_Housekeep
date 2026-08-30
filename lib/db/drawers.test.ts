import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRoom, deleteRoom } from "./rooms";
import { addFurnitureByName } from "./furniture";
import { listDrawersForFurniture, addDrawer, renameDrawer, deleteDrawer, listAllDrawers } from "./drawers";
import { createItem, listItemsInFurniture } from "./items";

let roomId: number;
let furnitureId: number;

beforeAll(async () => {
  roomId = (await createRoom({ name: `櫃桶測試房-${Date.now()}` })).id;
  furnitureId = (await addFurnitureByName(roomId, `櫃桶測試櫃-${Date.now()}`)).id;
});
afterAll(async () => {
  await deleteRoom(roomId);
});

describe("drawers", () => {
  it("adds a drawer to a furniture piece", async () => {
    const drawer = await addDrawer(furnitureId, "襪褲格");
    expect(drawer.furnitureId).toBe(furnitureId);
    expect(drawer.name).toBe("襪褲格");
  });

  it("rejects a blank drawer name", async () => {
    await expect(addDrawer(furnitureId, "  ")).rejects.toThrow(/名稱/);
  });

  it("lists drawers for the furniture piece", async () => {
    const drawers = await listDrawersForFurniture(furnitureId);
    expect(drawers.map((d) => d.name)).toContain("襪褲格");
  });

  it("renames a drawer", async () => {
    const drawer = await addDrawer(furnitureId, "改名前");
    const renamed = await renameDrawer(drawer.id, "改名後");
    expect(renamed.name).toBe("改名後");
  });

  it("deletes a drawer and cascades its items", async () => {
    const drawer = await addDrawer(furnitureId, "待刪除格");
    const item = await createItem({ furnitureId, drawerId: drawer.id, name: "格入面嘅嘢" });

    await deleteDrawer(drawer.id);

    expect(await listDrawersForFurniture(furnitureId)).not.toContainEqual(
      expect.objectContaining({ id: drawer.id }),
    );
    const remaining = await listItemsInFurniture(furnitureId);
    expect(remaining.map((i) => i.id)).not.toContain(item.id);
  });

  it("lists every drawer across all furniture pieces", async () => {
    const drawer = await addDrawer(furnitureId, `平鋪測試格-${Date.now()}`);
    const all = await listAllDrawers();
    expect(all.map((d) => d.id)).toContain(drawer.id);
  });
});
