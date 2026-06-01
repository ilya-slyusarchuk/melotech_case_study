import { describe, expect, it } from "vitest";
import { getGeneration } from "../../../../lib/generation-service";
import type { GenerationRequestRepository } from "@melotech/db";
import { NotFoundError } from "../../../../lib/api-helpers";

function createMockRepository(): GenerationRequestRepository {
  return {
    findByIdForUser: () => Promise.resolve(null),
  } as unknown as GenerationRequestRepository;
}

describe("getGeneration", () => {
  it("returns the generation when it belongs to the user", async () => {
    const repository = createMockRepository();
    repository.findByIdForUser = () =>
      Promise.resolve({
        id: "gen_1",
        status: "completed",
        platformOutputs: [],
      });

    const response = await getGeneration("gen_1", "user_a", repository);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.generation.id).toBe("gen_1");
  });

  it("throws NotFoundError when generation does not exist", async () => {
    const repository = createMockRepository();

    await expect(
      getGeneration("unknown", "user_a", repository),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when generation belongs to another user", async () => {
    const repository = createMockRepository();
    repository.findByIdForUser = () => Promise.resolve(null);

    await expect(
      getGeneration("gen_1", "user_b", repository),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
