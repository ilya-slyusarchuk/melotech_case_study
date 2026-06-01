"use client";

import { useEffect, useState } from "react";
import { GenerationHistoryItem } from "../../../components/generation/generation-history-item";
import { Select } from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { Loader2 } from "lucide-react";
import type { Platform } from "@melotech/shared";

/**
 * Generation history page.
 *
 * Lists the authenticated user&apos;s generations newest first.
 * Supports platform filtering. Each item links to its detail page.
 */
export default function GenerationsPage() {
  const [generations, setGenerations] = useState<GenerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("");

  useEffect(() => {
    async function fetchGenerations() {
      try {
        const url = new URL("/api/generations", window.location.origin);
        if (platformFilter) {
          url.searchParams.set("platform", platformFilter);
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
          setError("Failed to load history.");
          return;
        }

        const data = (await response.json()) as {
          generations: GenerationItem[];
        };
        setGenerations(data.generations);
      } catch {
        setError("Failed to load history.");
      } finally {
        setLoading(false);
      }
    }

    fetchGenerations();
  }, [platformFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-text-primary">
            History
          </h1>
          <p className="text-sm text-text-secondary">
            Review previous generations.
          </p>
        </div>

        <div className="w-full sm:w-48">
          <Label htmlFor="platform-filter" className="sr-only">
            Filter by platform
          </Label>
          <Select
            id="platform-filter"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="">All platforms</option>
            <option value="spotify">Spotify</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-error">{error}</p>
        </div>
      )}

      {!loading && !error && generations.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
          <p className="text-text-secondary">No generations yet.</p>
        </div>
      )}

      {!loading && !error && generations.length > 0 && (
        <div className="flex flex-col gap-3">
          {generations.map((gen) => (
            <GenerationHistoryItem
              key={gen.id}
              id={gen.id}
              rawPrompt={gen.rawPrompt}
              status={gen.status}
              platforms={gen.platformOutputs.map((o) => o.platform)}
              region={gen.region}
              ageRange={gen.ageRange}
              gender={gen.gender}
              consumedCredits={gen.consumedCredits}
              createdAt={gen.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type GenerationItem = {
  id: string;
  rawPrompt: string;
  status: string;
  region?: string | null;
  ageRange?: string | null;
  gender?: string | null;
  consumedCredits?: number | null;
  createdAt: string;
  platformOutputs: Array<{ platform: Platform }>;
};
