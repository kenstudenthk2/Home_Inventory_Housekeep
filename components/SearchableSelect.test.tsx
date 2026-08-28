// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchableSelect } from "./SearchableSelect";

// `vitest.config.ts` runs with `globals: false`, so @testing-library/react's
// automatic afterEach(cleanup) never registers; without this, DOM from an
// earlier test in this file leaks into the next one.
afterEach(cleanup);

const OPTIONS = [
  { id: 1, label: "床" },
  { id: 2, label: "衣櫃" },
  { id: 3, label: "床頭櫃" },
];

function hidden(name: string) {
  return document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`);
}

describe("SearchableSelect", () => {
  it("filters the option list as the user types", async () => {
    const user = userEvent.setup();
    render(<SearchableSelect name="furnitureType" label="傢俬類型" options={OPTIONS} />);

    await user.type(screen.getByLabelText("傢俬類型"), "床");

    expect(screen.getByRole("option", { name: "床" })).toBeDefined();
    expect(screen.getByRole("option", { name: "床頭櫃" })).toBeDefined();
    expect(screen.queryByRole("option", { name: "衣櫃" })).toBeNull();
  });

  it("submits the id when an existing option is chosen", async () => {
    const user = userEvent.setup();
    render(<SearchableSelect name="furnitureType" label="傢俬類型" options={OPTIONS} />);

    await user.type(screen.getByLabelText("傢俬類型"), "衣");
    await user.click(screen.getByRole("option", { name: "衣櫃" }));

    expect(hidden("furnitureTypeId")!.value).toBe("2");
    expect(hidden("furnitureTypeName")!.value).toBe("");
  });

  it("submits a new name when the typed text matches nothing", async () => {
    const user = userEvent.setup();
    render(
      <SearchableSelect name="furnitureType" label="傢俬類型" options={OPTIONS} allowCreate />,
    );

    await user.type(screen.getByLabelText("傢俬類型"), "酒櫃");

    expect(screen.getByText(/新增「酒櫃」/)).toBeDefined();
    expect(hidden("furnitureTypeName")!.value).toBe("酒櫃");
    expect(hidden("furnitureTypeId")!.value).toBe("");
  });

  it("does not offer creation when allowCreate is off", async () => {
    const user = userEvent.setup();
    render(<SearchableSelect name="furnitureType" label="傢俬類型" options={OPTIONS} />);

    await user.type(screen.getByLabelText("傢俬類型"), "酒櫃");

    expect(screen.queryByText(/新增/)).toBeNull();
    expect(screen.getByText("冇符合嘅選項")).toBeDefined();
  });

  it("clears a previously chosen id once the user edits the text again", async () => {
    const user = userEvent.setup();
    render(
      <SearchableSelect name="furnitureType" label="傢俬類型" options={OPTIONS} allowCreate />,
    );
    const input = screen.getByLabelText("傢俬類型");

    await user.type(input, "衣");
    await user.click(screen.getByRole("option", { name: "衣櫃" }));
    expect(hidden("furnitureTypeId")!.value).toBe("2");

    await user.type(input, "X");
    expect(hidden("furnitureTypeId")!.value).toBe("");
    expect(hidden("furnitureTypeName")!.value).toBe("衣櫃X");
  });
});
