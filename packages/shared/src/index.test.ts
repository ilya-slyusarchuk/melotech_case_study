import { describe, it, expect } from "vitest";
import {
  audienceTargetingSchema,
  createGenerationRequestSchema,
  PLATFORM_DISPLAY_METADATA,
  platformSchema,
  SHARED_VERSION,
  SUPPORTED_PLATFORMS,
} from "./index.js";

describe("shared smoke", () => {
  it("exports version", () => {
    expect(SHARED_VERSION).toBe("1.0.0");
  });
});

describe("platform contracts", () => {
  it("accepts every supported platform", () => {
    expect(platformSchema.safeParse("spotify").success).toBe(true);
    expect(platformSchema.safeParse("tiktok").success).toBe(true);
    expect(platformSchema.safeParse("youtube").success).toBe(true);
  });

  it("rejects unsupported platforms and empty strings", () => {
    expect(platformSchema.safeParse("instagram").success).toBe(false);
    expect(platformSchema.safeParse("").success).toBe(false);
  });

  it("has display metadata for every supported platform", () => {
    for (const platform of SUPPORTED_PLATFORMS) {
      expect(PLATFORM_DISPLAY_METADATA[platform]).toMatchObject({
        label: expect.any(String),
        description: expect.any(String),
        uiAccent: platform,
      });
    }
  });
});

describe("audience targeting schema", () => {
  it("accepts region only", () => {
    expect(audienceTargetingSchema.safeParse({ region: "Brazil" }).success).toBe(
      true,
    );
  });

  it("accepts region with age range", () => {
    expect(
      audienceTargetingSchema.safeParse({
        region: "Brazil",
        age_range: "18-24",
      }).success,
    ).toBe(true);
  });

  it("accepts region with gender", () => {
    expect(
      audienceTargetingSchema.safeParse({
        region: "Brazil",
        gender: "all",
      }).success,
    ).toBe(true);
  });

  it("accepts all audience fields together", () => {
    expect(
      audienceTargetingSchema.safeParse({
        region: "Brazil",
        age_range: "25-34",
        gender: "non_binary",
      }).success,
    ).toBe(true);
  });

  it("rejects empty region, unsupported age ranges, and unsupported genders", () => {
    expect(audienceTargetingSchema.safeParse({ region: "" }).success).toBe(
      false,
    );
    expect(
      audienceTargetingSchema.safeParse({ age_range: "65+" }).success,
    ).toBe(false);
    expect(
      audienceTargetingSchema.safeParse({ gender: "unknown" }).success,
    ).toBe(false);
  });
});

describe("generation request schema", () => {
  const validPrompt = "Create a confident reggaeton-pop launch concept.";

  it("accepts a valid prompt with one platform", () => {
    expect(
      createGenerationRequestSchema.safeParse({
        prompt: validPrompt,
        target_platforms: ["spotify"],
      }).success,
    ).toBe(true);
  });

  it("accepts a valid prompt with all supported platforms", () => {
    expect(
      createGenerationRequestSchema.safeParse({
        prompt: validPrompt,
        target_platforms: [...SUPPORTED_PLATFORMS],
      }).success,
    ).toBe(true);
  });

  it("accepts valid audience targeting", () => {
    expect(
      createGenerationRequestSchema.safeParse({
        prompt: validPrompt,
        target_platforms: ["youtube"],
        audience: {
          region: "Mexico",
          age_range: "18-24",
          gender: "female",
        },
      }).success,
    ).toBe(true);
  });

  it("rejects empty and too-short prompts", () => {
    expect(
      createGenerationRequestSchema.safeParse({
        prompt: "",
        target_platforms: ["spotify"],
      }).success,
    ).toBe(false);
    expect(
      createGenerationRequestSchema.safeParse({
        prompt: "short",
        target_platforms: ["spotify"],
      }).success,
    ).toBe(false);
  });

  it("rejects unsupported, duplicate, and empty platform selections", () => {
    expect(
      createGenerationRequestSchema.safeParse({
        prompt: validPrompt,
        target_platforms: ["instagram"],
      }).success,
    ).toBe(false);
    expect(
      createGenerationRequestSchema.safeParse({
        prompt: validPrompt,
        target_platforms: ["spotify", "spotify"],
      }).success,
    ).toBe(false);
    expect(
      createGenerationRequestSchema.safeParse({
        prompt: validPrompt,
        target_platforms: [],
      }).success,
    ).toBe(false);
  });
});
