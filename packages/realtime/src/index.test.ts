import { describe, it, expect } from "vitest";
import { REALTIME_VERSION } from "./index.js";

describe("realtime smoke", () => {
  it("exports version", () => {
    expect(REALTIME_VERSION).toBe("1.0.0");
  });
});
