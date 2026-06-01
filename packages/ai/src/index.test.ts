import { describe, it, expect } from "vitest";
import { AI_VERSION } from "./index.js";

describe("ai smoke", () => {
  it("exports version", () => {
    expect(AI_VERSION).toBe("1.0.0");
  });
});
