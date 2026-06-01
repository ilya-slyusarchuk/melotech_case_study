import { describe, expect, it } from "vitest";
import {
  AIProviderError,
  JSONExtractionError,
  SchemaValidationError,
  StructuredOutputError,
  UnsupportedPlatformGeneratorError,
} from "./errors.js";

const secret = "sk_test_secret_value";

describe("safe AI error taxonomy", () => {
  it("keeps provider public messages stable and secret-free", () => {
    const error = new AIProviderError({ apiKeyPresent: true }, secret);

    expect(error.publicMessage).toBe(
      "The AI provider could not complete the request.",
    );
    expect(error.message).not.toContain(secret);
    expect(error.metadata).toEqual({ apiKeyPresent: true });
  });

  it("keeps JSON extraction errors safe for API responses", () => {
    const error = new JSONExtractionError({ reason: "malformed_json" });

    expect(error.publicMessage).toBe(
      "The AI response did not contain one valid JSON object.",
    );
    expect(error.metadata).toEqual({ reason: "malformed_json" });
  });

  it("keeps schema validation details in metadata", () => {
    const error = new SchemaValidationError({
      issues: [{ path: "bpm", message: "Expected number" }],
    });

    expect(error.publicMessage).toBe(
      "The AI response did not match the expected output shape.",
    );
    expect(error.message).not.toContain("bpm");
    expect(error.metadata).toEqual({
      issues: [{ path: "bpm", message: "Expected number" }],
    });
  });

  it("keeps final structured output failures safe", () => {
    const error = new StructuredOutputError({
      reason: "repairs_exhausted",
      rawSecret: secret,
    });

    expect(error.publicMessage).toBe(
      "The AI response could not be safely validated.",
    );
    expect(error.message).not.toContain(secret);
    expect(error.metadata).toEqual({
      reason: "repairs_exhausted",
      rawSecret: secret,
    });
  });

  it("keeps unsupported platform generator errors safe", () => {
    const error = new UnsupportedPlatformGeneratorError({
      platform: "soundcloud",
    });

    expect(error.publicMessage).toBe(
      "The requested platform is not supported.",
    );
    expect(error.metadata).toEqual({ platform: "soundcloud" });
  });
});
