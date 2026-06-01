import type { AudienceTargeting, Platform } from "@melotech/shared";
import type {
  SpotifyOutput,
  TikTokOutput,
  YouTubeOutput,
} from "./platform-output-schemas.js";

export type PlatformOutputByPlatform = {
  spotify: SpotifyOutput;
  tiktok: TikTokOutput;
  youtube: YouTubeOutput;
};

export type PlatformGeneratorInput = {
  /**
   * Prompt enrichment happens before platform generation.
   * Generators add only platform-specific output requirements here.
   */
  enrichedPrompt: string;
  audience?: AudienceTargeting | null;
};

export interface PlatformGenerator<TPlatform extends Platform = Platform> {
  readonly platform: TPlatform;

  /**
   * Implementations must return validated structured output.
   * They should delegate parsing and schema checks to StructuredOutputService.
   */
  generate(
    input: PlatformGeneratorInput,
  ): Promise<PlatformOutputByPlatform[TPlatform]>;
}
