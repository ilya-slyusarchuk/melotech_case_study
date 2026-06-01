import { z } from "zod";

const nonEmptyTextSchema = z.string().trim().min(1);

export const spotifyOutputSchema = z.object({
  title: nonEmptyTextSchema,
  genre: nonEmptyTextSchema,
  mood: nonEmptyTextSchema,
  bpm: z.number().int().positive(),
  instruments: z.array(nonEmptyTextSchema).min(1),
  description: nonEmptyTextSchema,
});

export const tiktokOutputSchema = z.object({
  hook: nonEmptyTextSchema,
  hashtags: z
    .array(nonEmptyTextSchema.startsWith("#"))
    .length(3, "TikTok output must contain exactly three hashtags."),
});

export const youtubeOutputSchema = z.object({
  seoTitle: nonEmptyTextSchema,
  description: nonEmptyTextSchema,
  tags: z.array(nonEmptyTextSchema).min(1),
});

export type SpotifyOutput = z.infer<typeof spotifyOutputSchema>;
export type TikTokOutput = z.infer<typeof tiktokOutputSchema>;
export type YouTubeOutput = z.infer<typeof youtubeOutputSchema>;
