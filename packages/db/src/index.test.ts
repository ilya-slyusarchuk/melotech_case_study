import { describe, it, expect } from "vitest";
import { DB_VERSION } from "./index.js";

describe("db smoke", () => {
  it("exports version", () => {
    expect(DB_VERSION).toBe("1.0.0");
  });
});
