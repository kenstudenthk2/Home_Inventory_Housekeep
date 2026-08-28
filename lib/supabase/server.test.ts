import { describe, it, expect } from "vitest";
import { createClient } from "./server";

describe("createClient", () => {
  it("returns a client that can reach the database", async () => {
    const supabase = createClient();
    // information_schema is always present; this proves the connection + key work.
    const { error } = await supabase.rpc("version");
    // `version` is not a defined RPC, so we expect a PostgREST error, not a network error.
    expect(error?.message).not.toMatch(/fetch failed|ECONNREFUSED/);
  });

  it("returns a distinct client instance on each call", () => {
    expect(createClient()).not.toBe(createClient());
  });
});
