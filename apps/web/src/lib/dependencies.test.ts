import { describe, expect, it } from "vitest";
import { buildBullMqRedisConnectionOptions } from "./dependencies";

describe("buildBullMqRedisConnectionOptions", () => {
  it("preserves Redis URL auth and database details for BullMQ", () => {
    expect(
      buildBullMqRedisConnectionOptions(
        "redis://user:secret@redis.internal:6380/2",
      ),
    ).toEqual({
      host: "redis.internal",
      port: 6380,
      username: "user",
      password: "secret",
      db: 2,
    });
  });

  it("uses Redis defaults when optional URL parts are absent", () => {
    expect(buildBullMqRedisConnectionOptions("redis://localhost")).toEqual({
      host: "localhost",
      port: 6379,
      username: undefined,
      password: undefined,
      db: undefined,
    });
  });
});
