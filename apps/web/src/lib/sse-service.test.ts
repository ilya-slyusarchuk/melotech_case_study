import { describe, expect, it, vi } from "vitest";
import type { GenerationRequestRepository } from "@melotech/db";
import {
  verifyGenerationOwnership,
  createSseStream,
  handleGenerationEventsRequest,
} from "./sse-service";

describe("verifyGenerationOwnership", () => {
  it("returns generation when it belongs to the user", async () => {
    const repository = {
      findByIdForUser: vi.fn().mockResolvedValue({ id: "gen_1" }),
    } as unknown as GenerationRequestRepository;

    const result = await verifyGenerationOwnership(
      { generationRequestId: "gen_1", userId: "user_a" },
      { generationRepository: repository },
    );

    expect(result).toEqual({ id: "gen_1" });
    expect(repository.findByIdForUser).toHaveBeenCalledWith("user_a", "gen_1");
  });

  it("returns null when generation does not exist", async () => {
    const repository = {
      findByIdForUser: vi.fn().mockResolvedValue(null),
    } as unknown as GenerationRequestRepository;

    const result = await verifyGenerationOwnership(
      { generationRequestId: "gen_1", userId: "user_a" },
      { generationRepository: repository },
    );

    expect(result).toBeNull();
  });
});

describe("handleGenerationEventsRequest", () => {
  it("returns 404 when generation is not owned by user", async () => {
    const repository = {
      findByIdForUser: vi.fn().mockResolvedValue(null),
    } as unknown as GenerationRequestRepository;

    const mockRedis = {
      subscribe: vi.fn().mockResolvedValue(undefined),
      on: vi.fn().mockReturnThis(),
      off: vi.fn(),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
    };

    const response = await handleGenerationEventsRequest(
      { generationRequestId: "gen_1", userId: "user_a" },
      {
        generationRepository: repository,
        redisSubscriber: mockRedis as unknown as import("ioredis").default,
      },
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Generation not found.");
  });

  it("returns event-stream response when generation is owned", async () => {
    const repository = {
      findByIdForUser: vi.fn().mockResolvedValue({ id: "gen_1" }),
    } as unknown as GenerationRequestRepository;

    const mockRedis = {
      subscribe: vi.fn().mockResolvedValue(undefined),
      on: vi.fn().mockReturnThis(),
      off: vi.fn(),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
    };

    const response = await handleGenerationEventsRequest(
      { generationRequestId: "gen_1", userId: "user_a" },
      {
        generationRepository: repository,
        redisSubscriber: mockRedis as unknown as import("ioredis").default,
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });
});

describe("createSseStream", () => {
  it("subscribes to the correct Redis channel", async () => {
    const subscribe = vi.fn().mockResolvedValue(undefined);
    const on = vi.fn().mockReturnThis();
    const mockRedis = {
      subscribe,
      on,
      off: vi.fn(),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
    };

    const stream = createSseStream(
      "gen_1",
      mockRedis as unknown as import("ioredis").default,
    );

    // Start reading to trigger the start() callback.
    const reader = stream.getReader();

    // Wait a tick for the async subscribe to resolve.
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(subscribe).toHaveBeenCalledWith("generation:gen_1");
    expect(on).toHaveBeenCalledWith("message", expect.any(Function));
    expect(on).toHaveBeenCalledWith("error", expect.any(Function));

    await reader.cancel();
  });

  it("forwards Redis messages as SSE events", async () => {
    const subscribe = vi.fn().mockResolvedValue(undefined);
    const handlers: Record<string, Function> = {};
    const on = vi
      .fn()
      .mockImplementation((event: string, handler: Function) => {
        handlers[event] = handler;
        return mockRedis;
      });

    const mockRedis = {
      subscribe,
      on,
      off: vi.fn(),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
    };

    const stream = createSseStream(
      "gen_1",
      mockRedis as unknown as import("ioredis").default,
    );
    const reader = stream.getReader();

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Simulate a Redis message.
    handlers["message"](
      "generation:gen_1",
      JSON.stringify({
        type: "platform_update",
        platform: "spotify",
        status: "completed",
      }),
    );

    const result = await reader.read();
    const text = new TextDecoder().decode(result.value);

    expect(text).toContain("event: platform_update");
    expect(text).toContain('"platform":"spotify"');

    await reader.cancel();
  });

  it("cleans up Redis subscription on cancel", async () => {
    const unsubscribe = vi.fn().mockResolvedValue(undefined);
    const disconnect = vi.fn();
    const off = vi.fn();

    const mockRedis = {
      subscribe: vi.fn().mockResolvedValue(undefined),
      on: vi.fn().mockReturnThis(),
      off,
      unsubscribe,
      disconnect,
    };

    const stream = createSseStream(
      "gen_1",
      mockRedis as unknown as import("ioredis").default,
    );
    const reader = stream.getReader();

    await new Promise((resolve) => setTimeout(resolve, 10));
    await reader.cancel();

    expect(off).toHaveBeenCalledWith("message", expect.any(Function));
    expect(off).toHaveBeenCalledWith("error", expect.any(Function));
    expect(unsubscribe).toHaveBeenCalledWith("generation:gen_1");
    expect(disconnect).toHaveBeenCalled();
  });
});
