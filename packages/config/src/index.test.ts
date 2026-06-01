import { describe, it, expect } from "vitest";
import { CONFIG_VERSION } from "./index.js";

describe("config smoke", () => {
  it("exports version", () => {
    expect(CONFIG_VERSION).toBe("1.0.0");
  });
});
