import { describe, it, expect } from "vitest";
import {
  buildPlatformGenerationOptions,
  buildSimilarResultOptions,
  main,
} from "./index.js";

describe("worker smoke", () => {
  it("exports main entrypoint without side effects when not main", () => {
    // main is an async function that only wires dependencies.
    // It does not start processing unless called.
    expect(typeof main).toBe("function");
  });

  it("maps retry env config to platform generation options", () => {
    const options = buildPlatformGenerationOptions({
      GENERATION_RETRY_LIMIT: 3,
      LLM_REPAIR_RETRY_LIMIT: 2,
    });

    expect(options).toEqual({
      maxProviderRetries: 3,
      maxRepairs: 2,
    });
  });

  it("maps similarity env config to cache lookup options", () => {
    const options = buildSimilarResultOptions({
      SIMILARITY_THRESHOLD: 0.85,
    });

    expect(options).toEqual({
      similarityThreshold: 0.85,
    });
  });
});
