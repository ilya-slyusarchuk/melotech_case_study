import { describe, expect, it } from "vitest";
import type { AIAdapter, AIGenerateTextInput } from "./adapter.js";
import { StructuredOutputError } from "./errors.js";
import {
  spotifyOutputSchema,
  tiktokOutputSchema,
  youtubeOutputSchema,
} from "./platform-output-schemas.js";
import { SpotifyGenerator } from "./spotify-generator.js";
import { StructuredOutputService } from "./structured-output-service.js";
import type { StructuredOutputRequest } from "./structured-output-service.js";
import { TikTokGenerator } from "./tiktok-generator.js";
import { YouTubeGenerator } from "./youtube-generator.js";

class CapturingStructuredOutputService {
  public request?: StructuredOutputRequest<unknown>;

  constructor(
    private readonly result: unknown,
    private readonly error?: Error,
  ) {}

  async generate<TOutput>(
    request: StructuredOutputRequest<TOutput>,
  ): Promise<TOutput> {
    this.request = request as StructuredOutputRequest<unknown>;

    if (this.error) {
      throw this.error;
    }

    return this.result as TOutput;
  }
}

class StaticAdapter implements AIAdapter {
  public readonly calls: AIGenerateTextInput[] = [];

  constructor(private readonly response: string) {}

  async generateText(input: AIGenerateTextInput): Promise<string> {
    this.calls.push(input);
    return this.response;
  }
}

describe("SpotifyGenerator", () => {
  it("passes enriched prompt to structured output service", async () => {
    const service = new CapturingStructuredOutputService(validSpotifyOutput());
    const generator = new SpotifyGenerator(
      service as unknown as StructuredOutputService,
    );

    await generator.generate({
      enrichedPrompt: "Original music concept with audience enrichment.",
      audience: { region: "Brazil", age_range: "18-24" },
    });

    expect(service.request?.userPrompt).toContain(
      "Original music concept with audience enrichment.",
    );
    expect(service.request?.userPrompt).toContain("Region: Brazil");
    expect(service.request?.metadata).toMatchObject({
      platform: "spotify",
      region: "Brazil",
      ageRange: "18-24",
    });
  });

  it("uses Spotify schema", async () => {
    const service = new CapturingStructuredOutputService(validSpotifyOutput());
    const generator = new SpotifyGenerator(
      service as unknown as StructuredOutputService,
    );

    await generator.generate({ enrichedPrompt: "Create synth pop metadata." });

    expect(service.request?.schema).toBe(spotifyOutputSchema);
  });

  it("returns valid parsed output", async () => {
    const generator = new SpotifyGenerator(
      new StructuredOutputService(
        new StaticAdapter(JSON.stringify(validSpotifyOutput())),
      ),
      { maxProviderRetries: 0, maxRepairs: 0 },
    );

    await expect(
      generator.generate({ enrichedPrompt: "Create synth pop metadata." }),
    ).resolves.toMatchObject({ title: "Midnight Drive", bpm: 118 });
  });

  it("propagates structured output errors", async () => {
    const error = new StructuredOutputError({ reason: "test_failure" });
    const service = new CapturingStructuredOutputService(null, error);
    const generator = new SpotifyGenerator(
      service as unknown as StructuredOutputService,
    );

    await expect(
      generator.generate({ enrichedPrompt: "Create synth pop metadata." }),
    ).rejects.toBe(error);
  });
});

describe("TikTokGenerator", () => {
  it("passes enriched prompt and uses TikTok schema", async () => {
    const service = new CapturingStructuredOutputService(validTikTokOutput());
    const generator = new TikTokGenerator(
      service as unknown as StructuredOutputService,
    );

    await generator.generate({
      enrichedPrompt: "Audience-enriched club chorus.",
      audience: { region: "Mexico", gender: "all" },
    });

    expect(service.request?.userPrompt).toContain(
      "Audience-enriched club chorus.",
    );
    expect(service.request?.userPrompt).toContain("exactly three");
    expect(service.request?.schema).toBe(tiktokOutputSchema);
  });

  it("returns exactly three hashtags", async () => {
    const generator = new TikTokGenerator(
      new StructuredOutputService(
        new StaticAdapter(JSON.stringify(validTikTokOutput())),
      ),
      { maxProviderRetries: 0, maxRepairs: 0 },
    );

    const output = await generator.generate({
      enrichedPrompt: "Create TikTok launch copy.",
    });

    expect(output.hashtags).toHaveLength(3);
  });

  it("rejects invalid hashtag format through schema validation", async () => {
    const generator = new TikTokGenerator(
      new StructuredOutputService(
        new StaticAdapter(
          JSON.stringify({
            hook: "This chorus is ready for edits.",
            hashtags: ["#music", "newartist", "#fyp"],
          }),
        ),
      ),
      { maxProviderRetries: 0, maxRepairs: 0 },
    );

    await expect(
      generator.generate({ enrichedPrompt: "Create TikTok launch copy." }),
    ).rejects.toThrow(StructuredOutputError);
  });
});

describe("YouTubeGenerator", () => {
  it("passes enriched prompt and uses YouTube schema", async () => {
    const service = new CapturingStructuredOutputService(validYouTubeOutput());
    const generator = new YouTubeGenerator(
      service as unknown as StructuredOutputService,
    );

    await generator.generate({
      enrichedPrompt: "Audience-enriched official visualizer.",
      audience: { region: "Spain", age_range: "25-34", gender: "female" },
    });

    expect(service.request?.userPrompt).toContain(
      "Audience-enriched official visualizer.",
    );
    expect(service.request?.userPrompt).toContain("SEO title");
    expect(service.request?.schema).toBe(youtubeOutputSchema);
  });

  it("returns title, description, and tags", async () => {
    const generator = new YouTubeGenerator(
      new StructuredOutputService(
        new StaticAdapter(JSON.stringify(validYouTubeOutput())),
      ),
      { maxProviderRetries: 0, maxRepairs: 0 },
    );

    const output = await generator.generate({
      enrichedPrompt: "Create YouTube launch metadata.",
    });

    expect(output.seoTitle).toBe("Midnight Drive - Official Visualizer");
    expect(output.description).toBeTruthy();
    expect(output.tags).toEqual(["synth pop", "official visualizer"]);
  });

  it("rejects empty tags through schema validation", async () => {
    const generator = new YouTubeGenerator(
      new StructuredOutputService(
        new StaticAdapter(
          JSON.stringify({
            seoTitle: "Midnight Drive - Official Visualizer",
            description: "A search-friendly launch description.",
            tags: [],
          }),
        ),
      ),
      { maxProviderRetries: 0, maxRepairs: 0 },
    );

    await expect(
      generator.generate({ enrichedPrompt: "Create YouTube launch metadata." }),
    ).rejects.toThrow(StructuredOutputError);
  });
});

function validSpotifyOutput() {
  return {
    title: "Midnight Drive",
    genre: "Synth pop",
    mood: "Confident",
    bpm: 118,
    instruments: ["synth", "drums"],
    description: "A polished late-night pop track.",
  };
}

function validTikTokOutput() {
  return {
    hook: "This chorus was made for late-night edits.",
    hashtags: ["#music", "#newartist", "#fyp"],
  };
}

function validYouTubeOutput() {
  return {
    seoTitle: "Midnight Drive - Official Visualizer",
    description: "A search-friendly launch description.",
    tags: ["synth pop", "official visualizer"],
  };
}
