import type { Platform } from "@melotech/shared";
import { UnsupportedPlatformGeneratorError } from "./errors.js";
import type { PlatformGenerator } from "./platform-generator.js";

export class PlatformGeneratorRegistry {
  private readonly generatorsByPlatform = new Map<
    Platform,
    PlatformGenerator
  >();

  constructor(generators: PlatformGenerator[]) {
    for (const generator of generators) {
      // The registry is the single lookup table for platform behavior.
      // Later platforms should register here instead of adding scattered checks.
      this.generatorsByPlatform.set(generator.platform, generator);
    }
  }

  get(platform: Platform): PlatformGenerator {
    const generator = this.generatorsByPlatform.get(platform);

    if (!generator) {
      throw new UnsupportedPlatformGeneratorError({ platform });
    }

    return generator;
  }

  getMany(platforms: Platform[]): PlatformGenerator[] {
    // Map keeps the order requested by the user while reusing single lookup
    // behavior and the same safe unsupported-platform error.
    return platforms.map((platform) => this.get(platform));
  }
}
