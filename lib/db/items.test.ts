import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRoom, deleteRoom } from "./rooms";
import { addFurnitureByName } from "./furniture";
import { listCategories } from "./libraries";
import { listItemsInFurniture, createItem, updateItem, deleteItem } from "./items";

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
    const updated = await updateItem(item.id, { name: "更新後", quantity: 5, expiryDate: null });
    expect(updated.name).toBe("更新後");
    expect(updated.quantity).toBe(5);
  });

  it("deletes an item", async () => {
    const item = await createItem({ furnitureId, name: "待刪除" });
    await deleteItem(item.id);
    const remaining = await listItemsInFurniture(furnitureId);
    expect(remaining.map((i) => i.id)).not.toContain(item.id);
  });
});
