import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRoom, deleteRoom } from "./rooms";
import { addFurnitureByName } from "./furniture";
import { addDrawer } from "./drawers";
import { listCategories } from "./libraries";
import { listItemsInFurniture, listItemsInRoom, createItem, updateItem, moveItemLocation, deleteItem } from "./items";

let roomId: number;
let furnitureId: number;

beforeAll(async () => {
  roomId = (await createRoom({ name: `物品測試房-${Date.now()}` })).id;
  furnitureId = (await addFurnitureByName(roomId, `物品測試櫃-${Date.now()}`)).id;
});
afterAll(async () => {
  await deleteRoom(roomId);
});

describe("items", () => {
  it("creates an item with defaults", async () => {
    const item = await createItem({ furnitureId, name: "電芯" });
    expect(item.quantity).toBe(1);
    expect(item.categoryId).toBeNull();
    expect(item.expiryDate).toBeNull();
  });

  it("creates an item with a quantity, category id, and expiry date", async () => {
    const food = (await listCategories("食品"))[0];
    const item = await createItem({
      furnitureId,
      name: "罐頭",
      quantity: 12,
      categoryId: food.id,
      expiryDate: "2027-01-31",
    });
    expect(item.quantity).toBe(12);
    expect(item.categoryName).toBe("食品");
    expect(item.expiryDate).toBe("2027-01-31");
  });

  it("creates the category in the shared library when given a new name", async () => {
    const categoryName = `自訂分類-${Date.now()}`;
    const item = await createItem({ furnitureId, name: "特別物品", categoryName });
    expect(item.categoryName).toBe(categoryName);
    expect((await listCategories(categoryName)).length).toBe(1);
  });

  it("prefers categoryName over categoryId when both are given", async () => {
    const food = (await listCategories("食品"))[0];
    const categoryName = `優先分類-${Date.now()}`;
    const item = await createItem({ furnitureId, name: "優先測試", categoryId: food.id, categoryName });
    expect(item.categoryName).toBe(categoryName);
  });

  it("rejects a blank name", async () => {
    await expect(createItem({ furnitureId, name: "  " })).rejects.toThrow(/名稱/);
  });

  it("rejects a non-positive or non-integer quantity", async () => {
    await expect(createItem({ furnitureId, name: "壞數量", quantity: 0 })).rejects.toThrow(/數量/);
    await expect(createItem({ furnitureId, name: "壞數量", quantity: -3 })).rejects.toThrow(/數量/);
    await expect(createItem({ furnitureId, name: "壞數量", quantity: 1.5 })).rejects.toThrow(/數量/);
  });

  it("rejects a malformed expiry date", async () => {
    await expect(
      createItem({ furnitureId, name: "壞日期", expiryDate: "31/01/2027" }),
    ).rejects.toThrow(/日期/);
  });

  it("lists items in the furniture piece", async () => {
    const items = await listItemsInFurniture(furnitureId);
    expect(items.map((i) => i.name)).toContain("罐頭");
  });

  it("updates an item", async () => {
    const item = await createItem({ furnitureId, name: "更新前", quantity: 2 });
    const updated = await updateItem(item.id, furnitureId, {
      name: "更新後",
      quantity: 5,
      expiryDate: null,
    });
    expect(updated.name).toBe("更新後");
    expect(updated.quantity).toBe(5);
  });

  it("allows an item directly on furniture with no drawers", async () => {
    const item = await createItem({ furnitureId, name: "冇格嘅嘢" });
    expect(item.drawerId).toBeNull();
    expect(item.drawerName).toBeNull();
  });

  it("requires a drawer once the furniture has any", async () => {
    const drawerRoomId = (await createRoom({ name: `有格測試房-${Date.now()}` })).id;
    const drawerFurnitureId = (await addFurnitureByName(drawerRoomId, `有格測試櫃-${Date.now()}`)).id;
    await addDrawer(drawerFurnitureId, "第一格");

    await expect(
      createItem({ furnitureId: drawerFurnitureId, name: "冇揀格" }),
    ).rejects.toThrow(/櫃桶/);

    await deleteRoom(drawerRoomId);
  });

  it("creates and reads back an item scoped to a drawer", async () => {
    const drawerRoomId = (await createRoom({ name: `有格測試房二-${Date.now()}` })).id;
    const drawerFurnitureId = (await addFurnitureByName(drawerRoomId, `有格測試櫃二-${Date.now()}`)).id;
    const drawer = await addDrawer(drawerFurnitureId, "第一格");

    const item = await createItem({ furnitureId: drawerFurnitureId, drawerId: drawer.id, name: "格入面" });
    expect(item.drawerId).toBe(drawer.id);
    expect(item.drawerName).toBe("第一格");

    const scoped = await listItemsInFurniture(drawerFurnitureId, drawer.id);
    expect(scoped.map((i) => i.id)).toContain(item.id);

    await deleteRoom(drawerRoomId);
  });

  it("deletes an item", async () => {
    const item = await createItem({ furnitureId, name: "待刪除" });
    await deleteItem(item.id);
    const remaining = await listItemsInFurniture(furnitureId);
    expect(remaining.map((i) => i.id)).not.toContain(item.id);
  });

  it("moves an item to another furniture piece with no drawers", async () => {
    const moveRoomId = (await createRoom({ name: `搬移測試房-${Date.now()}` })).id;
    const moveFurnitureId = (await addFurnitureByName(moveRoomId, `搬移源櫃-${Date.now()}`)).id;
    const otherFurnitureId = (await addFurnitureByName(moveRoomId, `搬移目標櫃-${Date.now()}`)).id;
    const item = await createItem({ furnitureId: moveFurnitureId, name: "待搬移" });

    const moved = await moveItemLocation(item.id, otherFurnitureId, null);
    expect(moved.furnitureId).toBe(otherFurnitureId);
    expect(moved.drawerId).toBeNull();

    await deleteRoom(moveRoomId);
  });

  it("requires a drawer when moving into furniture that has one", async () => {
    const drawerRoomId = (await createRoom({ name: `搬移有格房-${Date.now()}` })).id;
    const drawerFurnitureId = (await addFurnitureByName(drawerRoomId, `搬移有格櫃-${Date.now()}`)).id;
    await addDrawer(drawerFurnitureId, "第一格");
    const item = await createItem({ furnitureId, name: "待搬移二" });

    await expect(moveItemLocation(item.id, drawerFurnitureId, null)).rejects.toThrow(/櫃桶/);

    await deleteRoom(drawerRoomId);
  });

  it("lists every item across all furniture pieces in the room", async () => {
    const otherFurnitureId = (await addFurnitureByName(roomId, `物品測試櫃二-${Date.now()}`)).id;
    await createItem({ furnitureId: otherFurnitureId, name: "房間測試物品" });

    const items = await listItemsInRoom(roomId);
    const names = items.map((i) => i.name);
    expect(names).toContain("罐頭");
    expect(names).toContain("房間測試物品");
    expect(items.every((i) => i.furnitureId === furnitureId || i.furnitureId === otherFurnitureId)).toBe(
      true,
    );
  });
});
