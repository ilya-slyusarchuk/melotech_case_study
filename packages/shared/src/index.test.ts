import { describe, it, expect } from "vitest";
import {
  audienceTargetingSchema,
  buildAudienceDisplayChips,
  buildAudiencePrompt,
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

describe("audience prompt builder", () => {
  const rawPrompt = "Create a Brazilian funk launch concept for late nights.";

  it("returns the original prompt when no audience is provided", () => {
    expect(buildAudiencePrompt(rawPrompt)).toBe(rawPrompt);
  });

  it("includes region when provided", () => {
    const prompt = buildAudiencePrompt(rawPrompt, { region: "Brazil" });

    expect(prompt).toContain("Original music concept:");
    expect(prompt).toContain(rawPrompt);
    expect(prompt).toContain("Target audience:");
    expect(prompt).toContain("- Target region: Brazil");
  });

  it("includes age range when provided", () => {
    const prompt = buildAudiencePrompt(rawPrompt, { age_range: "18-24" });

    expect(prompt).toContain("- Target age range: 18-24");
  });

  it("includes gender when provided", () => {
    const prompt = buildAudiencePrompt(rawPrompt, { gender: "female" });

    expect(prompt).toContain("- Target gender: Female");
  });

  it("does not render undefined fields", () => {
    const prompt = buildAudiencePrompt(rawPrompt, { region: "Mexico" });

    expect(prompt).toContain("- Target region: Mexico");
    expect(prompt).not.toContain("Target age range:");
    expect(prompt).not.toContain("Target gender:");
  });

  it("preserves the original prompt content", () => {
    const prompt = buildAudiencePrompt(rawPrompt, {
      region: "Brazil",
      age_range: "25-34",
      gender: "all",
    });

    expect(prompt).toContain(rawPrompt);
    expect(prompt).toContain(
      "local cultural preferences, platform behavior, language expectations, music discovery habits, genre affinity, and emotional positioning",
    );
  });
});

describe("audience display chips", () => {
  it("renders a region label correctly", () => {
    expect(buildAudienceDisplayChips({ region: "Brazil" })).toEqual([
      { key: "region", label: "Region", value: "Brazil" },
    ]);
  });

  it("does not create an empty label for missing age range", () => {
    expect(
      buildAudienceDisplayChips({ region: "Brazil", ageRange: null }),
    ).toEqual([{ key: "region", label: "Region", value: "Brazil" }]);
  });

  it("does not create an empty label for missing gender", () => {
    expect(buildAudienceDisplayChips({ region: "Brazil", gender: null })).toEqual(
      [{ key: "region", label: "Region", value: "Brazil" }],
    );
  });

  it("renders provided age range and gender labels", () => {
    expect(
      buildAudienceDisplayChips({
        region: "Mexico",
        ageRange: "18-24",
        gender: "non_binary",
      }),
    ).toEqual([
      { key: "region", label: "Region", value: "Mexico" },
      { key: "ageRange", label: "Age range", value: "18-24" },
      { key: "gender", label: "Gender", value: "Non-binary" },
    ]);
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
