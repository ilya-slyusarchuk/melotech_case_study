import { describe, expect, it } from "vitest";
import { requireSession, UnauthorizedError } from "./session";

describe("server session helpers", () => {
  it("returns a user when a valid session is provided", async () => {
    await expect(
      requireSession(async () => ({
        user: {
          id: "user_a",
          email: "artist@example.com",
          name: "Artist",
        },
      })),
    ).resolves.toMatchObject({
      user: {
        id: "user_a",
        email: "artist@example.com",
      },
    });
  });

  it("throws unauthorized when no session exists", async () => {
    await expect(requireSession(async () => null)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

