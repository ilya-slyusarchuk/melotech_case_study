import { describe, expect, it } from "vitest";
import {
  spotifyOutputSchema,
  tiktokOutputSchema,
  youtubeOutputSchema,
} from "./platform-output-schemas.js";

describe("platform output schemas", () => {
  it("accepts valid Spotify output", () => {
    expect(
      spotifyOutputSchema.safeParse({
        title: "Midnight Drive",
        genre: "Synth pop",
        mood: "Confident",
        bpm: 118,
        instruments: ["synth", "drums"],
        description: "A polished late-night pop track.",
      }).success,
    ).toBe(true);
  });

  it("rejects Spotify BPM as text", () => {
    expect(
      spotifyOutputSchema.safeParse({
        title: "Midnight Drive",
        genre: "Synth pop",
        mood: "Confident",
        bpm: "118",
        instruments: ["synth"],
        description: "A polished late-night pop track.",
      }).success,
    ).toBe(false);
  });

  it("rejects Spotify output missing instruments", () => {
    expect(
      spotifyOutputSchema.safeParse({
        title: "Midnight Drive",
        genre: "Synth pop",
        mood: "Confident",
        bpm: 118,
        description: "A polished late-night pop track.",
      }).success,
    ).toBe(false);
  });

  it("accepts valid TikTok output", () => {
    expect(
      tiktokOutputSchema.safeParse({
        hook: "This chorus was made for late-night edits.",
        hashtags: ["#music", "#newartist", "#fyp"],
      }).success,
    ).toBe(true);
  });

  it("rejects TikTok output with fewer or more than three hashtags", () => {
    expect(
      tiktokOutputSchema.safeParse({
        hook: "Try this sound.",
        hashtags: ["#music", "#fyp"],
      }).success,
    ).toBe(false);

    expect(
      tiktokOutputSchema.safeParse({
        hook: "Try this sound.",
        hashtags: ["#music", "#newartist", "#pop", "#fyp"],
      }).success,
    ).toBe(false);
  });

  it("rejects TikTok hashtags without a hash prefix", () => {
    expect(
      tiktokOutputSchema.safeParse({
        hook: "Try this sound.",
        hashtags: ["#music", "newartist", "#fyp"],
      }).success,
    ).toBe(false);
  });

  it("accepts valid YouTube output", () => {
    expect(
      youtubeOutputSchema.safeParse({
        seoTitle: "Midnight Drive - Official Visualizer",
        description: "A search-friendly launch description.",
        tags: ["synth pop", "official visualizer"],
      }).success,
    ).toBe(true);
  });

  it("rejects YouTube output with empty tags", () => {
    expect(
      youtubeOutputSchema.safeParse({
        seoTitle: "Midnight Drive - Official Visualizer",
        description: "A search-friendly launch description.",
        tags: [],
      }).success,
    ).toBe(false);
  });
});
