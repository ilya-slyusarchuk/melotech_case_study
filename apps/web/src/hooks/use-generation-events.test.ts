import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useGenerationEvents } from "./use-generation-events";

// ---------------------------------------------------------------------------
// Mock EventSource for jsdom tests.
// ---------------------------------------------------------------------------

type MockEventSource = {
  url: string;
  readyState: number;
  listeners: Record<string, EventListener[]>;
  addEventListener: (type: string, handler: EventListener) => void;
  removeEventListener: (type: string, handler: EventListener) => void;
  close: () => void;
  dispatchEvent: (type: string, event?: MessageEventInit) => void;
};

let lastMockEventSource: MockEventSource | null = null;

function createMockEventSource(url: string): MockEventSource {
  const listeners: Record<string, EventListener[]> = {};

  const es: MockEventSource = {
    url,
    readyState: 0,
    listeners,
    addEventListener(type: string, handler: EventListener) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(handler);
    },
    removeEventListener(type: string, handler: EventListener) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter((h) => h !== handler);
    },
    close() {
      this.readyState = 2;
    },
    dispatchEvent(type: string, eventInit?: MessageEventInit) {
      const event = new MessageEvent(type, eventInit);
      (listeners[type] ?? []).forEach((handler) => handler(event));
    },
  };

  lastMockEventSource = es;
  return es;
}

beforeEach(() => {
  vi.stubGlobal(
    "EventSource",
    vi.fn((url: string) => createMockEventSource(url)),
  );
  lastMockEventSource = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useGenerationEvents", () => {
  it("opens EventSource to the correct URL", () => {
    renderHook(() => useGenerationEvents("gen_123"));

    expect(EventSource).toHaveBeenCalledWith("/api/generations/gen_123/events");
    expect(lastMockEventSource).not.toBeNull();
  });

  it("does not open EventSource when generationRequestId is null", () => {
    renderHook(() => useGenerationEvents(null));

    expect(EventSource).not.toHaveBeenCalled();
  });

  it("closes EventSource on unmount", () => {
    const { unmount } = renderHook(() => useGenerationEvents("gen_123"));
    const es = lastMockEventSource;
    expect(es).not.toBeNull();

    unmount();
    expect(es!.readyState).toBe(2);
  });

  it("handles platform update event", async () => {
    const { result } = renderHook(() => useGenerationEvents("gen_123"));
    const es = lastMockEventSource!;

    // Simulate open first.
    act(() => {
      es.dispatchEvent("open");
    });

    act(() => {
      es.dispatchEvent("platform_update", {
        data: JSON.stringify({
          type: "platform_update",
          generationRequestId: "gen_123",
          platform: "spotify",
          status: "completed",
          source: "LLM",
        }),
      });
    });

    await waitFor(() => {
      expect(result.current.platformOutputs["spotify"]).toBeDefined();
    });

    expect(result.current.platformOutputs["spotify"]).toEqual({
      platform: "spotify",
      status: "completed",
      source: "LLM",
    });
  });

  it("handles generation update event", async () => {
    const { result } = renderHook(() => useGenerationEvents("gen_123"));
    const es = lastMockEventSource!;

    act(() => {
      es.dispatchEvent("open");
    });

    act(() => {
      es.dispatchEvent("generation_update", {
        data: JSON.stringify({
          type: "generation_update",
          generationRequestId: "gen_123",
          status: "completed",
        }),
      });
    });

    await waitFor(() => {
      expect(result.current.generationStatus).toBe("completed");
    });
  });

  it("handles credits update event", async () => {
    const { result } = renderHook(() => useGenerationEvents("gen_123"));
    const es = lastMockEventSource!;

    act(() => {
      es.dispatchEvent("open");
    });

    act(() => {
      es.dispatchEvent("credits_update", {
        data: JSON.stringify({
          type: "credits_update",
          generationRequestId: "gen_123",
          availableCredits: 80,
          reservedCredits: 20,
        }),
      });
    });

    await waitFor(() => {
      expect(result.current.credits).toEqual({
        availableCredits: 80,
        reservedCredits: 20,
      });
    });
  });

  it("ignores malformed events", async () => {
    const { result } = renderHook(() => useGenerationEvents("gen_123"));
    const es = lastMockEventSource!;

    act(() => {
      es.dispatchEvent("open");
    });

    act(() => {
      es.dispatchEvent("platform_update", {
        data: "not valid json",
      });
    });

    // Wait a tick.
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.current.platformOutputs).toEqual({});
  });

  it("sets isConnected to true on open", async () => {
    const { result } = renderHook(() => useGenerationEvents("gen_123"));
    const es = lastMockEventSource!;

    expect(result.current.isConnected).toBe(false);

    act(() => {
      es.dispatchEvent("open");
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it("sets error on connection error", async () => {
    const { result } = renderHook(() => useGenerationEvents("gen_123"));
    const es = lastMockEventSource!;

    act(() => {
      es.dispatchEvent("open");
    });
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    act(() => {
      es.dispatchEvent("error");
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Connection lost. Realtime updates are paused.",
      );
      expect(result.current.isConnected).toBe(false);
    });
  });

  it("resets state when generationRequestId changes", async () => {
    const { result, rerender } = renderHook(
      ({ id }) => useGenerationEvents(id),
      {
        initialProps: { id: "gen_1" as string | null },
      },
    );
    const firstEs = lastMockEventSource!;

    act(() => {
      firstEs.dispatchEvent("open");
    });

    act(() => {
      firstEs.dispatchEvent("generation_update", {
        data: JSON.stringify({
          type: "generation_update",
          generationRequestId: "gen_1",
          status: "completed",
        }),
      });
    });

    await waitFor(() =>
      expect(result.current.generationStatus).toBe("completed"),
    );

    // Change generation id.
    rerender({ id: "gen_2" });

    await waitFor(() => {
      expect(result.current.generationStatus).toBeNull();
      expect(result.current.platformOutputs).toEqual({});
      expect(result.current.credits).toBeNull();
    });

    // The old EventSource should be closed.
    expect(firstEs.readyState).toBe(2);
  });
});
