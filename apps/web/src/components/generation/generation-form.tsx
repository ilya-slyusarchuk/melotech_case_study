"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  SUPPORTED_PLATFORMS,
  PLATFORM_DISPLAY_METADATA,
  AUDIENCE_AGE_RANGES,
  AUDIENCE_GENDERS,
} from "@melotech/shared";
import { PLATFORM_CREDIT_COSTS } from "@melotech/billing";
import type { Platform } from "@melotech/shared";
import { cn } from "../../lib/utils";
import { AlertTriangle } from "lucide-react";

/**
 * Generation form component.
 *
 * Collects prompt, platform selection, and optional audience targeting.
 * Shows a live credit cost preview based on selected platforms.
 * Validates before submitting to the API.
 */
export function GenerationForm({
  availableCredits = 0,
}: {
  availableCredits?: number;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [region, setRegion] = useState("");
  const [ageRange, setAgeRange] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const costPreview = selectedPlatforms.reduce(
    (sum, platform) => sum + (PLATFORM_CREDIT_COSTS[platform] ?? 0),
    0,
  );

  const insufficientCredits = costPreview > 0 && costPreview > availableCredits;

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        return prev.filter((p) => p !== platform);
      }
      return [...prev, platform];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError("Select at least one platform.");
      return;
    }

    if (insufficientCredits) {
      setError("Not enough credits for the selected platforms.");
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        target_platforms: selectedPlatforms,
      };

      const audience: Record<string, string> = {};
      if (region.trim()) audience.region = region.trim();
      if (ageRange) audience.age_range = ageRange;
      if (gender) audience.gender = gender;

      if (Object.keys(audience).length > 0) {
        body.audience = audience;
      }

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };

        if (response.status === 429) {
          setError("Rate limit exceeded. Please wait a moment.");
        } else if (response.status === 402) {
          setError("Insufficient credits.");
        } else {
          setError(data.error || "Failed to start generation.");
        }
        return;
      }

      const data = (await response.json()) as { id: string };
      router.push(`/generations/${data.id}`);
    } catch {
      setError("Failed to start generation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Generation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Prompt */}
          <div>
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your music concept..."
            />
          </div>

          {/* Platforms */}
          <div>
            <Label>Platforms</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {SUPPORTED_PLATFORMS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    data-testid={`platform-${platform}`}
                    aria-pressed={isSelected}
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                      isSelected
                        ? "border-border-active bg-white/[0.12] text-text-primary"
                        : "border-border-subtle bg-transparent text-text-secondary hover:border-border-active hover:text-text-primary",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Badge variant={platform} className="pointer-events-none">
                        {PLATFORM_DISPLAY_METADATA[platform].label}
                      </Badge>
                      <span className="text-text-tertiary text-xs">
                        {PLATFORM_CREDIT_COSTS[platform]} cr
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audience targeting */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Japan"
              />
            </div>

            <div>
              <Label htmlFor="age_range">Age Range</Label>
              <Select
                id="age_range"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
              >
                <option value="">Any</option>
                {AUDIENCE_AGE_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Any</option>
                {AUDIENCE_GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g === "non_binary"
                      ? "Non-binary"
                      : g.charAt(0).toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Cost preview */}
          {selectedPlatforms.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">Estimated cost:</span>
              <span
                className={cn(
                  "font-mono font-medium",
                  insufficientCredits ? "text-error" : "text-text-primary",
                )}
              >
                {costPreview} credits
              </span>
              {insufficientCredits && (
                <span className="flex items-center gap-1 text-xs text-error">
                  <AlertTriangle className="h-3 w-3" />
                  Insufficient balance
                </span>
              )}
            </div>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          <Button
            type="submit"
            isLoading={loading}
            disabled={insufficientCredits}
            className="w-full sm:w-auto"
          >
            Generate Outputs
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
