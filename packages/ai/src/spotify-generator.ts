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
        "You must return exactly one raw JSON object and nothing else.",
        'Required JSON shape: {"title":"string","genre":"string","mood":"string","bpm":120,"instruments":["string"],"description":"string"}',
        "Use bpm as a positive integer number, not a string.",
        "Use instruments as a non-empty array of strings.",
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
