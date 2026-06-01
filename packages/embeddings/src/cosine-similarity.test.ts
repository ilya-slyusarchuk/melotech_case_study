import { describe, expect, it } from "vitest";
import { cosineSimilarity } from "./cosine-similarity.js";

describe("cosineSimilarity", () => {
  it("returns the highest score for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it("returns zero for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it("ranks similar vectors above unrelated vectors", () => {
    const query = [1, 0.9, 0];
    const similar = [1, 1, 0.1];
    const unrelated = [0, 0, 1];

    expect(cosineSimilarity(query, similar)).toBeGreaterThan(
      cosineSimilarity(query, unrelated),
    );
  });

  it("handles zero vectors safely", () => {
    expect(() => cosineSimilarity([0, 0], [1, 2])).not.toThrow();
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });
});
