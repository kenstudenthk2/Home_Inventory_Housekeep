import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRoom, deleteRoom } from "./rooms";
import { addFurnitureByName } from "./furniture";
import { createItem } from "./items";
import { listInventory, listExpiringItems, expiryStatusOf } from "./inventory";

let roomId: number;
let furnitureId: number;
const stamp = Date.now();

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

beforeAll(async () => {
  roomId = (await createRoom({ name: `清單房-${stamp}` })).id;
  furnitureId = (await addFurnitureByName(roomId, `清單櫃-${stamp}`)).id;
  await createItem({ furnitureId, name: `過期奶-${stamp}`, expiryDate: isoDaysFromNow(-3) });
  await createItem({ furnitureId, name: `快過期麵-${stamp}`, expiryDate: isoDaysFromNow(10) });
  await createItem({ furnitureId, name: `遠期米-${stamp}`, expiryDate: isoDaysFromNow(400) });
  await createItem({ furnitureId, name: `無期電芯-${stamp}`, quantity: 4 });
});
afterAll(async () => {
  await deleteRoom(roomId);
});

describe("expiryStatusOf", () => {
  const today = new Date("2026-06-15T00:00:00Z");

  it("classifies each case", () => {
    expect(expiryStatusOf(null, today)).toBe("none");
    expect(expiryStatusOf("2026-06-14", today)).toBe("expired");
    expect(expiryStatusOf("2026-06-15", today)).toBe("expiring_soon");
    expect(expiryStatusOf("2026-07-10", today)).toBe("expiring_soon");
    expect(expiryStatusOf("2026-09-01", today)).toBe("ok");
  });
});

describe("listInventory", () => {
  it("returns rows carrying their room and furniture names", async () => {
    const rows = await listInventory({ roomId });
    expect(rows.length).toBe(4);
    expect(rows[0].roomName).toContain("清單房");
    expect(rows[0].furnitureName).toContain("清單櫃");
  });

  it("filters by a search term on the item name", async () => {
    const rows = await listInventory({ search: `無期電芯-${stamp}` });
    expect(rows.length).toBe(1);
    expect(rows[0].quantity).toBe(4);
  });

  it("filters by furniture", async () => {
    expect((await listInventory({ furnitureId })).length).toBe(4);
  });

  it("filters to expired only", async () => {
    const rows = await listInventory({ roomId, expiryStatus: "expired" });
    expect(rows.map((r) => r.itemName)).toEqual([`過期奶-${stamp}`]);
  });

  it("filters to items with no expiry date", async () => {
    const rows = await listInventory({ roomId, expiryStatus: "no_expiry" });
    expect(rows.map((r) => r.itemName)).toEqual([`無期電芯-${stamp}`]);
  });

  it("returns an empty list when nothing matches", async () => {
    expect(await listInventory({ search: "絕對唔存在嘅物品名" })).toEqual([]);
  });

  it("sorts by quantity descending", async () => {
    const rows = await listInventory({ roomId, sort: "quantity" });
    expect(rows[0].itemName).toBe(`無期電芯-${stamp}`);
  });

  it("sorts by expiry date, soonest first, with undated rows last", async () => {
    const rows = await listInventory({ roomId, sort: "expiry" });
    expect(rows[0].itemName).toBe(`過期奶-${stamp}`);
    expect(rows[rows.length - 1].itemName).toBe(`無期電芯-${stamp}`);
  });
});

describe("listExpiringItems", () => {
  it("returns expired and soon-expiring items, expired first", async () => {
    const rows = (await listExpiringItems(30)).filter((r) => r.roomId === roomId);
    expect(rows.map((r) => r.itemName)).toEqual([`過期奶-${stamp}`, `快過期麵-${stamp}`]);
  });

  it("excludes items outside the window and items with no date", async () => {
    const names = (await listExpiringItems(30)).filter((r) => r.roomId === roomId).map((r) => r.itemName);
    expect(names).not.toContain(`遠期米-${stamp}`);
    expect(names).not.toContain(`無期電芯-${stamp}`);
  });
});
