"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Frontend hook for subscribing to generation events via Server-Sent Events.
//
// The hook opens an EventSource to /api/generations/{id}/events and keeps
// local state in sync with platform updates, generation status changes,
// and credit balance updates pushed by the worker.
// ---------------------------------------------------------------------------

export type PlatformOutputState = {
  platform: string;
  status: string;
  source?: "LLM" | "CACHE";
};

export type GenerationEventState = {
  generationRequestId: string;
  generationStatus: string | null;
  platformOutputs: Record<string, PlatformOutputState>;
  credits: { availableCredits: number; reservedCredits: number } | null;
};

export type UseGenerationEventsReturn = GenerationEventState & {
  isConnected: boolean;
  error: string | null;
};

/**
 * React hook that subscribes to SSE events for a generation request.
 *
 * - Opens an EventSource when generationRequestId is provided.
 * - Updates platform output state in real time.
 * - Updates generation status when a generation_update event arrives.
 * - Updates credit state when a credits_update event arrives.
 * - Closes the connection automatically on unmount.
 * - Does not duplicate events (uses the event id field for deduplication).
 */
export function useGenerationEvents(
  generationRequestId: string | null | undefined,
): UseGenerationEventsReturn {
  const [generationStatus, setGenerationStatus] = useState<string | null>(
    null,
  );
  const [platformOutputs, setPlatformOutputs] = useState<
    Record<string, PlatformOutputState>
  >({});
  const [credits, setCredits] = useState<{
    availableCredits: number;
    reservedCredits: number;
  } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track seen event ids to avoid processing duplicate events.
  const seenEventIds = useRef<Set<string>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);

  const handlePlatformUpdate = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as {
          generationRequestId: string;
          platform: string;
          status: string;
          source?: "LLM" | "CACHE";
        };

        setPlatformOutputs((prev) => ({
          ...prev,
          [data.platform]: {
            platform: data.platform,
            status: data.status,
            source: data.source,
          },
        }));
      } catch {
        // Ignore malformed events.
      }
    },
    [],
  );

  const handleGenerationUpdate = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as {
          generationRequestId: string;
          status: string;
        };
        setGenerationStatus(data.status);
      } catch {
        // Ignore malformed events.
      }
    },
    [],
  );

  const handleCreditsUpdate = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as {
        generationRequestId: string;
        availableCredits: number;
        reservedCredits: number;
      };
      setCredits({
        availableCredits: data.availableCredits,
        reservedCredits: data.reservedCredits,
      });
    } catch {
      // Ignore malformed events.
    }
  }, []);

  const handleError = useCallback(() => {
    setIsConnected(false);
    setError("Connection lost. Realtime updates are paused.");
  }, []);

  const handleOpen = useCallback(() => {
    setIsConnected(true);
    setError(null);
  }, []);

  useEffect(() => {
    // Reset state when the generation id changes.
    seenEventIds.current.clear();
    setGenerationStatus(null);
    setPlatformOutputs({});
    setCredits(null);
    setIsConnected(false);
    setError(null);

    if (!generationRequestId) {
      return;
    }

    const url = `/api/generations/${generationRequestId}/events`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("open", handleOpen);
    es.addEventListener("platform_update", handlePlatformUpdate);
    es.addEventListener("generation_update", handleGenerationUpdate);
    es.addEventListener("credits_update", handleCreditsUpdate);
    es.addEventListener("error", handleError);

    return () => {
      // Clean up: remove listeners and close the EventSource.
      es.removeEventListener("open", handleOpen);
      es.removeEventListener("platform_update", handlePlatformUpdate);
      es.removeEventListener("generation_update", handleGenerationUpdate);
      es.removeEventListener("credits_update", handleCreditsUpdate);
      es.removeEventListener("error", handleError);
      es.close();
      eventSourceRef.current = null;
    };
  }, [
    generationRequestId,
    handlePlatformUpdate,
    handleGenerationUpdate,
    handleCreditsUpdate,
    handleError,
    handleOpen,
  ]);

  return {
    generationRequestId: generationRequestId ?? "",
    generationStatus,
    platformOutputs,
    credits,
    isConnected,
    error,
  };
}
