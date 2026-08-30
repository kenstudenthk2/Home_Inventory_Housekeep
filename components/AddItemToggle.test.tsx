// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddItemToggle } from "./AddItemToggle";

afterEach(cleanup);

describe("AddItemToggle", () => {
  it("shows the add-item button by default, and the form after clicking it", async () => {
    const user = userEvent.setup();
    render(<AddItemToggle rooms={[]} furniture={[]} drawers={[]} categories={[]} itemNamesByCategoryId={{}} />);

    expect(screen.queryByLabelText("房間")).toBeNull();

    await user.click(screen.getByRole("button", { name: "新增物品" }));
    expect(screen.getByLabelText("房間")).toBeDefined();
  });

  it("collapses back to the button when the form is cancelled", async () => {
    const user = userEvent.setup();
    render(<AddItemToggle rooms={[]} furniture={[]} drawers={[]} categories={[]} itemNamesByCategoryId={{}} />);

    await user.click(screen.getByRole("button", { name: "新增物品" }));
    await user.click(screen.getByRole("button", { name: "取消" }));

    expect(screen.getByRole("button", { name: "新增物品" })).toBeDefined();
    expect(screen.queryByLabelText("房間")).toBeNull();
  });
});
