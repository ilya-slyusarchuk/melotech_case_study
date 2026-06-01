import { describe, it, expect } from "vitest";
import { main } from "./index.js";

describe("worker smoke", () => {
  it("exports main entrypoint without side effects when not main", () => {
    // main is an async function that only wires dependencies.
    // It does not start processing unless called.
    expect(typeof main).toBe("function");
  });
});
