import { describe, it, expect } from "vitest";
import { QUEUE_VERSION } from "./index.js";

describe("queue smoke", () => {
  it("exports version", () => {
    expect(QUEUE_VERSION).toBe("1.0.0");
  });
});
