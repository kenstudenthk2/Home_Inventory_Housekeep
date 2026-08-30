// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InventoryItemRow } from "./InventoryItemRow";
import type { InventoryRow } from "@/lib/db/inventory";
import type { RoomSummary } from "@/lib/db/rooms";
import type { Furniture, Drawer } from "@/lib/db/types";

afterEach(cleanup);

const ROOMS: RoomSummary[] = [
  { id: 1, name: "睡房", roomTypeId: null, roomTypeLabel: null, widthCm: null, lengthCm: null, furnitureCount: 0, itemCount: 0 },
  { id: 2, name: "廚房", roomTypeId: null, roomTypeLabel: null, widthCm: null, lengthCm: null, furnitureCount: 0, itemCount: 0 },
];
const FURNITURE: Furniture[] = [
  { id: 10, roomId: 1, furnitureTypeId: 1, customName: null, displayName: "衣櫃", iconKey: "box" },
  { id: 20, roomId: 2, furnitureTypeId: 2, customName: null, displayName: "雪櫃", iconKey: "box" },
];
const DRAWERS: Drawer[] = [];

const ROW: InventoryRow = {
  itemId: 1,
  itemName: "電芯",
  quantity: 4,
  expiryDate: null,
  categoryId: null,
  categoryName: null,
  drawerId: null,
  drawerName: null,
  furnitureId: 10,
  furnitureName: "衣櫃",
  roomId: 1,
  roomName: "睡房",
};

describe("InventoryItemRow", () => {
  it("shows the current location as a label, not an editor, by default", () => {
    render(<InventoryItemRow row={ROW} rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} />);
    expect(screen.getByText("睡房 · 衣櫃")).toBeDefined();
    expect(screen.queryByLabelText("房間")).toBeNull();
  });

  it("opens the location picker preset to the current room/furniture when clicked", async () => {
    const user = userEvent.setup();
    render(<InventoryItemRow row={ROW} rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} />);

    await user.click(screen.getByText("睡房 · 衣櫃"));

    expect((screen.getByLabelText("房間") as HTMLSelectElement).value).toBe("1");
  });

  it("switches the quantity display into an editable input when clicked", async () => {
    const user = userEvent.setup();
    render(<InventoryItemRow row={ROW} rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} />);

    await user.click(screen.getByLabelText("編輯電芯數量"));
    expect(screen.getByDisplayValue("4")).toBeDefined();
  });
});
