import type {
  PlatformGenerator,
  PlatformGeneratorInput,
} from "./platform-generator.js";
import {
  tiktokOutputSchema,
  type TikTokOutput,
} from "./platform-output-schemas.js";
import {
  buildPlatformMetadata,
  buildPlatformUserPrompt,
  resolvePlatformGenerationOptions,
  type PlatformGenerationOptions,
} from "./platform-generator-support.js";
import type { StructuredOutputService } from "./structured-output-service.js";

export class TikTokGenerator implements PlatformGenerator<"tiktok"> {
  public readonly platform = "tiktok" as const;
  private readonly options: PlatformGenerationOptions;

  constructor(
    private readonly structuredOutputService: StructuredOutputService,
    options?: Partial<PlatformGenerationOptions>,
  ) {
    this.options = resolvePlatformGenerationOptions(options);
  }

  async generate(input: PlatformGeneratorInput): Promise<TikTokOutput> {
    return this.structuredOutputService.generate<TikTokOutput>({
      schema: tiktokOutputSchema,
      systemPrompt: [
        "You create concise TikTok metadata for AI-generated music promotion.",
        "Return JSON only with hook and hashtags.",
        "Hashtags must be exactly three strings and each one must start with #.",
      ].join("\n"),
      userPrompt: buildPlatformUserPrompt({
        enrichedPrompt: input.enrichedPrompt,
        audience: input.audience,
        platformInstructions: [
          "Write a short-form friendly hook that can introduce the sound quickly.",
          "Return exactly three trend-style hashtags.",
          "Do not claim real-time trend knowledge or current chart status unless web/search access is explicitly available.",
          "When audience or region metadata is present, adapt the hook and hashtags to that context.",
        ],
      }),
      metadata: buildPlatformMetadata(this.platform, input.audience),
      ...this.options,
    });
  }
}
