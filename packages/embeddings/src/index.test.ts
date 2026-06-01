import { describe, it, expect } from "vitest";
import { EMBEDDINGS_VERSION } from "./index.js";

describe("embeddings smoke", () => {
  it("exports version", () => {
    expect(EMBEDDINGS_VERSION).toBe("1.0.0");
  });
});
