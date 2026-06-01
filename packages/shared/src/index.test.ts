import { describe, it, expect } from "vitest";
import { SHARED_VERSION } from "./index.js";

describe("shared smoke", () => {
  it("exports version", () => {
    expect(SHARED_VERSION).toBe("1.0.0");
  });
});
