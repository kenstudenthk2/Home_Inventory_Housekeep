import { describe, it, expect } from "vitest";
import { ICON_OPTIONS, iconComponentFor } from "./icons";

describe("icon mapping", () => {
  it("offers a picker list with stable keys and Chinese labels", () => {
    expect(ICON_OPTIONS.length).toBeGreaterThanOrEqual(8);
    expect(ICON_OPTIONS.map((o) => o.key)).toContain("bed");
    expect(ICON_OPTIONS.find((o) => o.key === "bed")!.label).toBe("床");
  });

  it("resolves every seeded icon key to a component", () => {
    for (const key of ["bed", "cabinet", "sofa", "fridge", "desk", "bookshelf", "box", "shelf"]) {
      expect(typeof iconComponentFor(key)).not.toBe("undefined");
    }
  });

  it("falls back for an unknown key instead of throwing", () => {
    expect(iconComponentFor("no-such-icon")).toBe(iconComponentFor("box"));
  });
});
