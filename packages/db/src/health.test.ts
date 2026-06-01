import { describe, expect, it } from "vitest";
import { checkDatabaseHealth } from "./health.js";

describe("database health utility", () => {
  it("returns success when the database accepts a query", async () => {
    await expect(
      checkDatabaseHealth({
        $queryRaw: async () => 1,
      }),
    ).resolves.toEqual({
      ok: true,
      message: "Database connection succeeded.",
    });
  });

  it("returns failure when the database query throws", async () => {
    await expect(
      checkDatabaseHealth({
        $queryRaw: async () => {
          throw new Error("offline");
        },
      }),
    ).resolves.toEqual({
      ok: false,
      message: "Database connection failed.",
    });
  });
});

