import { describe, it, expect } from "vitest";
import { BILLING_VERSION } from "./index.js";

describe("billing smoke", () => {
  it("exports version", () => {
    expect(BILLING_VERSION).toBe("1.0.0");
  });
});
