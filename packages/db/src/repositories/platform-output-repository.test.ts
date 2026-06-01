import { describe, expect, it } from "vitest";
import {
  PlatformOutputRepository,
  type PlatformOutputRepositoryClient,
} from "./platform-output-repository.js";

type TestPlatformOutputClient = PlatformOutputRepositoryClient & {
  lastCreateManyArgs: unknown;
};

describe("platform output repository", () => {
  it("creates pending platform outputs for a generation", async () => {
    const client = createPlatformOutputClient();
    const repository = new PlatformOutputRepository(client);

    await repository.createPendingOutputs("generation_a", ["spotify", "youtube"]);

    expect(client.lastCreateManyArgs).toEqual({
      data: [
        {
          generationRequestId: "generation_a",
          platform: "spotify",
          status: "pending",
        },
        {
          generationRequestId: "generation_a",
          platform: "youtube",
          status: "pending",
        },
      ],
    });
  });
});

function createPlatformOutputClient() {
  const client: TestPlatformOutputClient = {
    lastCreateManyArgs: null as unknown,
    platformOutput: {
      createMany: async (args: unknown) => {
        client.lastCreateManyArgs = args;
        return { count: 2 };
      },
    },
  };

  return client;
}
