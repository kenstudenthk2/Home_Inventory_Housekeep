import { describe, it, expect } from "vitest";
import { optionalNumber, optionalText } from "@/lib/form";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("optionalNumber", () => {
  it("parses a number", () => {
    expect(optionalNumber(form({ widthCm: "350.5" }), "widthCm")).toBe(350.5);
  });

  it("returns null for an empty or missing field", () => {
    expect(optionalNumber(form({ widthCm: "" }), "widthCm")).toBeNull();
    expect(optionalNumber(form({}), "widthCm")).toBeNull();
  });

  it("returns null for whitespace", () => {
    expect(optionalNumber(form({ widthCm: "   " }), "widthCm")).toBeNull();
  });

  it("throws on a non-numeric value", () => {
    expect(() => optionalNumber(form({ widthCm: "abc" }), "widthCm")).toThrow(/數字/);
  });
});

describe("optionalText", () => {
  it("trims and returns the text", () => {
    expect(optionalText(form({ name: "  床  " }), "name")).toBe("床");
  });

  it("returns null for an empty, whitespace, or missing field", () => {
    expect(optionalText(form({ name: "" }), "name")).toBeNull();
    expect(optionalText(form({ name: "   " }), "name")).toBeNull();
    expect(optionalText(form({}), "name")).toBeNull();
  });
});
