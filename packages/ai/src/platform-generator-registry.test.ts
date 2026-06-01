import { describe, expect, it } from "vitest";
import type { Platform } from "@melotech/shared";
import { UnsupportedPlatformGeneratorError } from "./errors.js";
import type {
  PlatformGenerator,
  PlatformGeneratorInput,
  PlatformOutputByPlatform,
} from "./platform-generator.js";
import { PlatformGeneratorRegistry } from "./platform-generator-registry.js";
import type { SpotifyOutput } from "./platform-output-schemas.js";

class FakeSpotifyGenerator implements PlatformGenerator<"spotify"> {
  public readonly platform = "spotify" as const;

  async generate(): Promise<SpotifyOutput> {
    return {
      title: "Midnight Drive",
      genre: "Synth pop",
      mood: "Confident",
      bpm: 118,
      instruments: ["synth"],
      description: "A polished late-night track.",
    };
  }
}

class FakeGenerator<
  TPlatform extends Platform,
> implements PlatformGenerator<TPlatform> {
  constructor(public readonly platform: TPlatform) {}

  async generate(
    _input: PlatformGeneratorInput,
  ): Promise<PlatformOutputByPlatform[TPlatform]> {
    throw new Error("Fake registry tests only verify lookup behavior.");
  }
}

describe("PlatformGenerator interface and registry", () => {
  it("allows a fake generator to implement the interface", async () => {
    const generator: PlatformGenerator<"spotify"> = new FakeSpotifyGenerator();

    await expect(
      generator.generate({ enrichedPrompt: "Create late-night synth pop." }),
    ).resolves.toMatchObject({ title: "Midnight Drive" });
  });

  it("can store interface implementations", () => {
    const spotify = new FakeSpotifyGenerator();
    const registry = new PlatformGeneratorRegistry([spotify]);

    expect(registry.get("spotify")).toBe(spotify);
  });

  it("returns Spotify generator", () => {
    const spotify = new FakeGenerator("spotify");
    const registry = new PlatformGeneratorRegistry([spotify]);

    expect(registry.get("spotify")).toBe(spotify);
  });

  it("returns TikTok generator", () => {
    const tiktok = new FakeGenerator("tiktok");
    const registry = new PlatformGeneratorRegistry([tiktok]);

    expect(registry.get("tiktok")).toBe(tiktok);
  });

  it("returns YouTube generator", () => {
    const youtube = new FakeGenerator("youtube");
    const registry = new PlatformGeneratorRegistry([youtube]);

    expect(registry.get("youtube")).toBe(youtube);
  });

  it("preserves requested order", () => {
    const spotify = new FakeGenerator("spotify");
    const tiktok = new FakeGenerator("tiktok");
    const youtube = new FakeGenerator("youtube");
    const registry = new PlatformGeneratorRegistry([spotify, tiktok, youtube]);

    expect(registry.getMany(["youtube", "spotify", "tiktok"])).toEqual([
      youtube,
      spotify,
      tiktok,
    ]);
  });

  it("rejects unsupported platform with a safe error", () => {
    const registry = new PlatformGeneratorRegistry([]);

    expect(() => registry.get("soundcloud" as Platform)).toThrow(
      UnsupportedPlatformGeneratorError,
    );
  });
});
