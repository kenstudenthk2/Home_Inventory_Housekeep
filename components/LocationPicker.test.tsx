// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationPicker, UNASSIGNED_LOCATION_VALUE } from "./LocationPicker";
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

const DRAWERS: Drawer[] = [{ id: 100, furnitureId: 10, name: "上格", sortOrder: 0 }];

function hidden(name: string) {
  return document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`);
}

describe("LocationPicker", () => {
  it("shows only furniture belonging to the chosen room", async () => {
    const user = userEvent.setup();
    render(<LocationPicker rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} idPrefix="test" />);

    await user.selectOptions(screen.getByLabelText("房間"), "1");
    expect(screen.getByRole("option", { name: "衣櫃" })).toBeDefined();
    expect(screen.queryByRole("option", { name: "雪櫃" })).toBeNull();
  });

  it("reveals the drawer select once a furniture piece with drawers is chosen", async () => {
    const user = userEvent.setup();
    render(<LocationPicker rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} idPrefix="test" />);

    await user.selectOptions(screen.getByLabelText("房間"), "1");
    await user.selectOptions(screen.getByLabelText("傢俬"), "10");
    expect(screen.getByLabelText("櫃桶")).toBeDefined();

    await user.selectOptions(screen.getByLabelText("櫃桶"), "100");
    expect(hidden("drawerId")!.value).toBe("100");
  });

  it("hides furniture/drawer selects and submits the unassigned sentinel", async () => {
    const user = userEvent.setup();
    render(<LocationPicker rooms={ROOMS} furniture={FURNITURE} drawers={DRAWERS} idPrefix="test" />);

    await user.selectOptions(screen.getByLabelText("房間"), UNASSIGNED_LOCATION_VALUE);
    expect(screen.queryByLabelText("傢俬")).toBeNull();
    expect(hidden("furnitureId")!.value).toBe(UNASSIGNED_LOCATION_VALUE);
  });

  it("preselects the room and furniture that already own the given furniture id", () => {
    render(
      <LocationPicker
        rooms={ROOMS}
        furniture={FURNITURE}
        drawers={DRAWERS}
        defaultFurnitureId={20}
        idPrefix="test"
      />,
    );

    expect((screen.getByLabelText("房間") as HTMLSelectElement).value).toBe("2");
    expect(hidden("furnitureId")!.value).toBe("20");
  });
});
