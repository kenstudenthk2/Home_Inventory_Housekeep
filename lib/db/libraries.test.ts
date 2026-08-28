import { describe, it, expect } from "vitest";
import {
  listFurnitureTypes,
  findOrCreateFurnitureType,
  listCategories,
  findOrCreateCategory,
  listSuggestedFurnitureTypes,
  listRoomTypes,
} from "./libraries";

describe("furniture type library", () => {
  it("lists seeded types", async () => {
    const all = await listFurnitureTypes();
    expect(all.map((t) => t.name)).toContain("床");
  });

  it("filters by a search substring", async () => {
    const results = await listFurnitureTypes("櫃");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((t) => t.name.includes("櫃"))).toBe(true);
  });

  it("creates a new type and makes it visible to a later list call", async () => {
    const name = `測試傢俬-${Date.now()}`;
    const created = await findOrCreateFurnitureType(name, "cabinet");
    expect(created.name).toBe(name);

    const found = await listFurnitureTypes(name);
    expect(found.map((t) => t.id)).toContain(created.id);
  });

  it("returns the existing row instead of creating a duplicate", async () => {
    const name = `重複傢俬-${Date.now()}`;
    const first = await findOrCreateFurnitureType(name);
    const second = await findOrCreateFurnitureType(name);
    expect(second.id).toBe(first.id);
  });

  it("treats differing case and surrounding whitespace as the same name", async () => {
    const base = `Case-Test-${Date.now()}`;
    const first = await findOrCreateFurnitureType(base);
    const second = await findOrCreateFurnitureType(`  ${base.toLowerCase()}  `);
    expect(second.id).toBe(first.id);
  });

  it("rejects a blank name", async () => {
    await expect(findOrCreateFurnitureType("   ")).rejects.toThrow(/名稱/);
  });

  it("defaults the icon key when none is given", async () => {
    const created = await findOrCreateFurnitureType(`無圖示-${Date.now()}`);
    expect(created.iconKey).toBe("box");
  });
});

describe("category library", () => {
  it("lists seeded categories", async () => {
    const all = await listCategories();
    expect(all.map((c) => c.name)).toContain("食品");
  });

  it("returns the existing row instead of creating a duplicate", async () => {
    const name = `重複分類-${Date.now()}`;
    const first = await findOrCreateCategory(name);
    const second = await findOrCreateCategory(name);
    expect(second.id).toBe(first.id);
  });

  it("rejects a blank name", async () => {
    await expect(findOrCreateCategory("")).rejects.toThrow(/名稱/);
  });
});

describe("room types and suggestions", () => {
  it("lists room types in sort order", async () => {
    const types = await listRoomTypes();
    expect(types[0].key).toBe("bedroom");
    expect(types.map((t) => t.label)).toContain("廚房");
  });

  it("suggests bedroom furniture", async () => {
    const types = await listRoomTypes();
    const bedroom = types.find((t) => t.key === "bedroom")!;
    const suggestions = await listSuggestedFurnitureTypes(bedroom.id);
    expect(suggestions.map((s) => s.name)).toEqual(
      expect.arrayContaining(["床", "衣櫃", "床頭櫃"]),
    );
  });

  it("returns an empty list for an unknown room type id", async () => {
    expect(await listSuggestedFurnitureTypes(999999)).toEqual([]);
  });
});
