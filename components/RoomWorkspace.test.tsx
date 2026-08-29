// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoomWorkspace } from "./RoomWorkspace";
import type { Item } from "@/lib/db/types";
import type { FurnitureSummary } from "@/lib/db/furniture";

afterEach(cleanup);

function furniturePiece(id: number, displayName: string, itemCount: number): FurnitureSummary {
  return {
    id,
    roomId: 1,
    furnitureTypeId: 1,
    customName: null,
    displayName,
    iconKey: "box",
    itemCount,
  };
}

function item(id: number, furnitureId: number, name: string): Item {
  return { id, furnitureId, categoryId: null, categoryName: null, name, quantity: 1, expiryDate: null };
}

describe("RoomWorkspace", () => {
  it("defaults to the first furniture piece and shows its items", () => {
    render(
      <RoomWorkspace
        roomId={1}
        furniture={[furniturePiece(1, "衣櫃", 1), furniturePiece(2, "床頭櫃", 1)]}
        itemsByFurnitureId={{ 1: [item(10, 1, "冬季外套")], 2: [item(20, 2, "眼罩")] }}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    expect(screen.getByText("冬季外套")).toBeDefined();
    expect(screen.queryByText("眼罩")).toBeNull();
  });

  it("switches the shown items when another furniture piece is selected", async () => {
    const user = userEvent.setup();
    render(
      <RoomWorkspace
        roomId={1}
        furniture={[furniturePiece(1, "衣櫃", 1), furniturePiece(2, "床頭櫃", 1)]}
        itemsByFurnitureId={{ 1: [item(10, 1, "冬季外套")], 2: [item(20, 2, "眼罩")] }}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "選擇床頭櫃" }));

    expect(screen.getByText("眼罩")).toBeDefined();
    expect(screen.queryByText("冬季外套")).toBeNull();
  });

  it("shows a prompt instead of the item form when the room has no furniture", () => {
    render(
      <RoomWorkspace
        roomId={1}
        furniture={[]}
        itemsByFurnitureId={{}}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    expect(screen.getByText("仲未有傢俬,右邊新增一件先。")).toBeDefined();
    expect(screen.queryByLabelText("物品名稱")).toBeNull();
  });

  it("falls back to the first remaining furniture piece once the selected one disappears", () => {
    const { rerender } = render(
      <RoomWorkspace
        roomId={1}
        furniture={[furniturePiece(1, "衣櫃", 1), furniturePiece(2, "床頭櫃", 1)]}
        itemsByFurnitureId={{ 1: [item(10, 1, "冬季外套")], 2: [item(20, 2, "眼罩")] }}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    rerender(
      <RoomWorkspace
        roomId={1}
        furniture={[furniturePiece(1, "衣櫃", 1)]}
        itemsByFurnitureId={{ 1: [item(10, 1, "冬季外套")] }}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    expect(screen.getByText("冬季外套")).toBeDefined();
  });
});
