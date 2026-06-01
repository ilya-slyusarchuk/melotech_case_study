"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PlatformOutputCard } from "../../../../components/generation/platform-output-card";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { useGenerationEvents } from "../../../../hooks/use-generation-events";
import { buildAudienceDisplayChips } from "@melotech/shared";
import type { Platform } from "@melotech/shared";
import { Loader2 } from "lucide-react";

/**
 * Generation detail page.
 *
 * Shows the generation status, prompt, audience chips, and one platform
 * output card per selected platform. Uses SSE for realtime updates.
 * Side-by-side on desktop, stacked on mobile.
 */
export default function GenerationDetailPage() {
  const params = useParams();
  const generationRequestId = typeof params.id === "string" ? params.id : null;

  const [generation, setGeneration] = useState<GenerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    generationStatus: sseStatus,
    platformOutputs: sseOutputs,
    isConnected,
    error: sseError,
  } = useGenerationEvents(generationRequestId);

  // Fetch initial generation data.
  useEffect(() => {
    if (!generationRequestId) return;

    async function fetchGeneration() {
      try {
        const response = await fetch(`/api/generations/${generationRequestId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Generation not found.");
          } else {
            setError("Failed to load generation.");
          }
          return;
        }

        const data = (await response.json()) as { generation: GenerationData };
        setGeneration(data.generation);
      } catch {
        setError("Failed to load generation.");
      } finally {
        setLoading(false);
      }
    }

    fetchGeneration();
  }, [generationRequestId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (error || !generation) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-error">{error || "Generation not found."}</p>
      </div>
    );
  }

  const status = sseStatus ?? generation.status;
  const audienceChips = buildAudienceDisplayChips({
    region: generation.region,
    ageRange: generation.ageRange,
    gender: generation.gender,
  });

  // Merge SSE outputs with the fetched generation outputs.
  const platformOutputs = generation.platformOutputs.map((output) => {
    const sse = sseOutputs[output.platform];
    if (sse) {
      return {
        ...output,
        status: sse.status as PlatformOutputStatus,
        source: sse.source ?? output.source,
      };
    }
    return output;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold uppercase tracking-tight text-text-primary">
            Generation
          </h1>
          <StatusBadge status={status} />
        </div>

        {!isConnected && !sseError && status !== "completed" && status !== "failed" && status !== "partial" && (
          <p className="text-xs text-text-tertiary">
            Reconnecting to realtime updates...
          </p>
        )}

        {sseError && (
          <p className="text-xs text-warning">{sseError}</p>
        )}
      </div>

      {/* Prompt and audience */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs text-text-tertiary">Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-primary">{generation.rawPrompt}</p>

          {audienceChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {audienceChips.map((chip) => (
                <Badge key={chip.key} variant="default">
                  {chip.label}: {chip.value}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform outputs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platformOutputs.map((output) => (
          <PlatformOutputCard
            key={output.platform}
            platform={output.platform}
            status={output.status}
            content={output.content as Record<string, unknown> | null}
            source={output.source}
          />
        ))}
      </div>
    </div>
  );
}

type PlatformOutputStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "completed_from_cache";

type GenerationData = {
  id: string;
  rawPrompt: string;
  status: string;
  region?: string | null;
  ageRange?: string | null;
  gender?: string | null;
  createdAt: string;
  platformOutputs: Array<{
    id: string;
    platform: Platform;
    status: PlatformOutputStatus;
    content?: unknown;
    source?: "LLM" | "CACHE" | null;
  }>;
};

function StatusBadge({ status }: { status: string }) {
  const variant: Record<string, "default" | "success" | "warning" | "error" | "processing"> = {
    pending: "default",
    processing: "processing",
    completed: "success",
    partial: "warning",
    failed: "error",
  };

  return (
    <Badge variant={variant[status] ?? "default"}>
      {status.replace("_", " ").toUpperCase()}
    </Badge>
  );
}
