import { describe, expect, it } from "vitest";

describe("auth client helpers", () => {
  it("can be imported without server side effects", async () => {
    const authClient = await import("./auth-client");

    expect(authClient.signInWithEmail).toEqual(expect.any(Function));
    expect(authClient.signUpWithEmail).toEqual(expect.any(Function));
    expect(authClient.signOut).toEqual(expect.any(Function));
    expect(authClient.useSession).toEqual(expect.any(Function));
  });
});

