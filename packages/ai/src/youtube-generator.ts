import type {
  PlatformGenerator,
  PlatformGeneratorInput,
} from "./platform-generator.js";
import {
  youtubeOutputSchema,
  type YouTubeOutput,
} from "./platform-output-schemas.js";
import {
  buildPlatformMetadata,
  buildPlatformUserPrompt,
  resolvePlatformGenerationOptions,
  type PlatformGenerationOptions,
} from "./platform-generator-support.js";
import type { StructuredOutputService } from "./structured-output-service.js";

export class YouTubeGenerator implements PlatformGenerator<"youtube"> {
  public readonly platform = "youtube" as const;
  private readonly options: PlatformGenerationOptions;

  constructor(
    private readonly structuredOutputService: StructuredOutputService,
    options?: Partial<PlatformGenerationOptions>,
  ) {
    this.options = resolvePlatformGenerationOptions(options);
  }

  async generate(input: PlatformGeneratorInput): Promise<YouTubeOutput> {
    return this.structuredOutputService.generate<YouTubeOutput>({
      schema: youtubeOutputSchema,
      systemPrompt: [
        "You create search-oriented YouTube metadata for AI-generated music.",
        "You must return exactly one raw JSON object and nothing else.",
        'Required JSON shape: {"seoTitle":"string","description":"string","tags":["string"]}',
        "Tags must be a non-empty array of discoverability phrases.",
        "Rules for JSON output:",
        "- No markdown fences (no ```json blocks).",
        "- No prose before or after the JSON object.",
        "- No literal line breaks inside JSON string values. Use escaped \\n instead.",
        "- No trailing commas.",
        "- No markdown formatting like **bold** or emoji inside string values.",
        "- All string values must be plain text on a single JSON line.",
      ].join("\n"),
      userPrompt: buildPlatformUserPrompt({
        enrichedPrompt: input.enrichedPrompt,
        audience: input.audience,
        platformInstructions: [
          "Write an SEO title, description, and tags for YouTube discovery.",
          "Optimize for search intent, related music queries, and audience fit.",
          "When region or demographic metadata is present, adapt wording and keywords to that context.",
        ],
      }),
      metadata: buildPlatformMetadata(this.platform, input.audience),
      ...this.options,
    });
  }
}
