import { describe, expect, it } from "vitest";
import {
  createGeneration,
  listGenerations,
} from "../../../lib/generation-service";
import type {
  GenerationDeps,
  ListGenerationDeps,
} from "../../../lib/generation-service";
import { RateLimitExceededError } from "../../../lib/rate-limiter";
import {
  InsufficientCreditsError,
  ValidationError,
} from "../../../lib/api-helpers";

function createMockDeps(): GenerationDeps {
  return {
    rateLimiter: {
      check: () => Promise.resolve(),
    } as unknown as GenerationDeps["rateLimiter"],
    generationRepository: {
      createForUser: () => Promise.resolve({ id: "gen_1" }),
      updateStatusForWorker: () =>
        Promise.resolve({ id: "gen_1", status: "failed" }),
      findByIdForUser: () => Promise.resolve(null),
      listForUser: () => Promise.resolve([]),
    } as unknown as GenerationDeps["generationRepository"],
    creditService: {
      ensureWalletForUser: () => Promise.resolve({ id: "wallet_1" }),
      reserveCreditsForGeneration: () => Promise.resolve({ id: "res_1" }),
      releaseUnusedReservedCredits: () => Promise.resolve({ id: "ledger_1" }),
    } as unknown as GenerationDeps["creditService"],
    queueProducer: {
      enqueue: () => Promise.resolve({ jobId: "job_1" }),
    } as unknown as GenerationDeps["queueProducer"],
  };
}

function createMockListDeps(): ListGenerationDeps {
  return {
    generationRepository: {
      listForUser: () => Promise.resolve([]),
    } as unknown as ListGenerationDeps["generationRepository"],
  };
}

describe("createGeneration", () => {
  it("returns validation error for invalid request body", async () => {
    const deps = createMockDeps();

    const request = new Request("http://localhost/api/generations", {
      method: "POST",
      body: JSON.stringify({
        prompt: "short",
        target_platforms: ["spotify"],
      }),
    });

    await expect(
      createGeneration(request, "user_a", deps),
    ).rejects.toBeInstanceOf(Error);
  });

  it("rejects rate-limited requests before database creation", async () => {
    const deps = createMockDeps();
    deps.rateLimiter.check = () => Promise.reject(new RateLimitExceededError());

    const request = new Request("http://localhost/api/generations", {
      method: "POST",
      body: JSON.stringify({
        prompt: "Create a Brazilian funk launch concept with heavy bass.",
        target_platforms: ["spotify"],
      }),
    });

    await expect(
      createGeneration(request, "user_a", deps),
    ).rejects.toBeInstanceOf(RateLimitExceededError);
  });

  it("returns insufficient credits error when wallet balance is too low", async () => {
    const deps = createMockDeps();
    deps.generationRepository.createForUser = () =>
      Promise.resolve({ id: "gen_1" });
    deps.creditService.reserveCreditsForGeneration = () =>
      Promise.reject(new Error("Insufficient available credits."));

    const request = new Request("http://localhost/api/generations", {
      method: "POST",
      body: JSON.stringify({
        prompt: "Create a Brazilian funk launch concept with heavy bass.",
        target_platforms: ["spotify"],
      }),
    });

    await expect(
      createGeneration(request, "user_a", deps),
    ).rejects.toBeInstanceOf(InsufficientCreditsError);
  });

  it("creates generation and enqueues job for valid requests", async () => {
    const deps = createMockDeps();
    deps.generationRepository.createForUser = () =>
      Promise.resolve({ id: "gen_1" });
    (deps.creditService as any).reserveCreditsForGeneration = () =>
      Promise.resolve({ id: "res_1" });
    deps.queueProducer.enqueue = () => Promise.resolve({ jobId: "job_1" });

    const request = new Request("http://localhost/api/generations", {
      method: "POST",
      body: JSON.stringify({
        prompt: "Create a Brazilian funk launch concept with heavy bass.",
        target_platforms: ["spotify"],
      }),
    });

    const response = await createGeneration(request, "user_a", deps);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body).toMatchObject({ id: "gen_1", status: "pending" });
  });

  it("releases reserved credits when enqueue fails", async () => {
    const deps = createMockDeps();
    deps.generationRepository.createForUser = () =>
      Promise.resolve({ id: "gen_1" });
    (deps.creditService as any).reserveCreditsForGeneration = () =>
      Promise.resolve({ id: "res_1" });
    deps.queueProducer.enqueue = () =>
      Promise.reject(new Error("Queue is down."));

    let releaseCalled = false;
    (deps.creditService as any).releaseUnusedReservedCredits = async () => {
      releaseCalled = true;
      return { id: "ledger_1" };
    };

    const request = new Request("http://localhost/api/generations", {
      method: "POST",
      body: JSON.stringify({
        prompt: "Create a Brazilian funk launch concept with heavy bass.",
        target_platforms: ["spotify"],
      }),
    });

    await expect(createGeneration(request, "user_a", deps)).rejects.toThrow(
      "Failed to start generation. Please try again.",
    );
    expect(releaseCalled).toBe(true);
  });
});

describe("listGenerations", () => {
  it("returns own generations", async () => {
    const deps = createMockListDeps();
    deps.generationRepository.listForUser = () =>
      Promise.resolve([
        { id: "gen_1", status: "pending" },
        { id: "gen_2", status: "completed" },
      ]);

    const request = new Request("http://localhost/api/generations");
    const response = await listGenerations(request, "user_a", deps);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.generations).toHaveLength(2);
  });

  it("filters by platform", async () => {
    const deps = createMockListDeps();
    deps.generationRepository.listForUser = ({ platform }) => {
      expect(platform).toBe("spotify");
      return Promise.resolve([{ id: "gen_1", status: "completed" }]);
    };

    const request = new Request(
      "http://localhost/api/generations?platform=spotify",
    );
    const response = await listGenerations(request, "user_a", deps);
    expect(response.status).toBe(200);
  });

  it("filters by status", async () => {
    const deps = createMockListDeps();
    deps.generationRepository.listForUser = () =>
      Promise.resolve([
        { id: "gen_1", status: "completed" },
        { id: "gen_2", status: "pending" },
      ]);

    const request = new Request(
      "http://localhost/api/generations?status=completed",
    );
    const response = await listGenerations(request, "user_a", deps);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.generations).toHaveLength(1);
    expect(body.generations[0].status).toBe("completed");
  });

  it("rejects invalid status filter", async () => {
    const deps = createMockListDeps();

    const request = new Request(
      "http://localhost/api/generations?status=unknown",
    );
    await expect(
      listGenerations(request, "user_a", deps),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
