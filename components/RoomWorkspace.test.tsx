// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoomWorkspace } from "./RoomWorkspace";
import type { Drawer, Item } from "@/lib/db/types";
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

function item(id: number, furnitureId: number, name: string, drawerId: number | null = null): Item {
  return {
    id,
    furnitureId,
    drawerId,
    drawerName: null,
    categoryId: null,
    categoryName: null,
    name,
    quantity: 1,
    expiryDate: null,
  };
}

function drawer(id: number, furnitureId: number, name: string): Drawer {
  return { id, furnitureId, name, sortOrder: 0 };
}

describe("RoomWorkspace", () => {
  it("defaults to the first furniture piece and shows its items", () => {
    render(
      <RoomWorkspace
        roomId={1}
        furniture={[furniturePiece(1, "衣櫃", 1), furniturePiece(2, "床頭櫃", 1)]}
        itemsByFurnitureId={{ 1: [item(10, 1, "冬季外套")], 2: [item(20, 2, "眼罩")] }}
        drawersByFurnitureId={{}}
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
        drawersByFurnitureId={{}}
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
        drawersByFurnitureId={{}}
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
        drawersByFurnitureId={{}}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    rerender(
      <RoomWorkspace
        roomId={1}
        furniture={[furniturePiece(1, "衣櫃", 1)]}
        itemsByFurnitureId={{ 1: [item(10, 1, "冬季外套")] }}
        drawersByFurnitureId={{}}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    expect(screen.getByText("冬季外套")).toBeDefined();
  });

  it("scopes the item list to the selected drawer and keeps unfiled items reachable", async () => {
    const user = userEvent.setup();
    render(
      <RoomWorkspace
        roomId={1}
        furniture={[furniturePiece(1, "衣櫃", 2)]}
        itemsByFurnitureId={{ 1: [item(10, 1, "格入面嘅嘢", 100), item(11, 1, "舊物品(冇格)")] }}
        drawersByFurnitureId={{ 1: [drawer(100, 1, "襪褲格")] }}
        categories={[]}
        itemNamesByCategoryId={{}}
      />,
    );

    // Defaults to the first real drawer tab.
    expect(screen.getByText("格入面嘅嘢")).toBeDefined();
    expect(screen.queryByText("舊物品(冇格)")).toBeNull();

    await user.click(screen.getByRole("button", { name: "未分類" }));

    expect(screen.getByText("舊物品(冇格)")).toBeDefined();
    expect(screen.queryByText("格入面嘅嘢")).toBeNull();
  });
});
