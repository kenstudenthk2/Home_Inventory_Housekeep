// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickAddItemForm } from "./QuickAddItemForm";
import type { RoomSummary } from "@/lib/db/rooms";
import type { Furniture, Drawer } from "@/lib/db/types";

afterEach(cleanup);

const ROOMS: RoomSummary[] = [
  { id: 1, name: "睡房", roomTypeId: null, roomTypeLabel: null, widthCm: null, lengthCm: null, furnitureCount: 0, itemCount: 0 },
];
const FURNITURE: Furniture[] = [
  { id: 10, roomId: 1, furnitureTypeId: 1, customName: null, displayName: "衣櫃", iconKey: "box" },
];
const DRAWERS: Drawer[] = [];

describe("QuickAddItemForm", () => {
  it("renders the location picker and item fields", () => {
    render(
      <QuickAddItemForm
        rooms={ROOMS}
        furniture={FURNITURE}
        drawers={DRAWERS}
        categories={[]}
        itemNamesByCategoryId={{}}
        onDone={() => {}}
      />,
    );

    expect(screen.getByLabelText("房間")).toBeDefined();
    expect(screen.getByLabelText("物品名稱")).toBeDefined();
    expect(screen.getByLabelText("數量")).toBeDefined();
  });

  it("calls onDone when cancelled without submitting", async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(
      <QuickAddItemForm
        rooms={ROOMS}
        furniture={FURNITURE}
        drawers={DRAWERS}
        categories={[]}
        itemNamesByCategoryId={{}}
        onDone={onDone}
      />,
    );

    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
