import type {
  PlatformGenerator,
  PlatformGeneratorInput,
} from "./platform-generator.js";
import {
  spotifyOutputSchema,
  type SpotifyOutput,
} from "./platform-output-schemas.js";
import {
  buildPlatformMetadata,
  buildPlatformUserPrompt,
  resolvePlatformGenerationOptions,
  type PlatformGenerationOptions,
} from "./platform-generator-support.js";
import type { StructuredOutputService } from "./structured-output-service.js";

export class SpotifyGenerator implements PlatformGenerator<"spotify"> {
  public readonly platform = "spotify" as const;
  private readonly options: PlatformGenerationOptions;

  constructor(
    private readonly structuredOutputService: StructuredOutputService,
    options?: Partial<PlatformGenerationOptions>,
  ) {
    this.options = resolvePlatformGenerationOptions(options);
  }

  async generate(input: PlatformGeneratorInput): Promise<SpotifyOutput> {
    return this.structuredOutputService.generate<SpotifyOutput>({
      schema: spotifyOutputSchema,
      systemPrompt: [
        "You create validated Spotify distribution metadata for AI-generated music.",
        "Return JSON only with title, genre, mood, bpm, instruments, and description.",
        "Use bpm as a positive integer and instruments as a non-empty array.",
      ].join("\n"),
      userPrompt: buildPlatformUserPrompt({
        enrichedPrompt: input.enrichedPrompt,
        audience: input.audience,
        platformInstructions: [
          "Prepare metadata for Spotify distribution, playlist discovery, and listener expectations.",
          "Produce title, genre, mood, BPM, instruments, and description.",
          "When audience or region metadata is present, adapt the metadata to that context.",
        ],
      }),
      metadata: buildPlatformMetadata(this.platform, input.audience),
      ...this.options,
    });
  }
}
