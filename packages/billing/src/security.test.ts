import { describe, expect, it } from "vitest";
import { assertNoClientCreditFields } from "./index.js";

describe("credit security rules", () => {
  it("rejects API payloads that contain fake credit amounts", () => {
    expect(() =>
      assertNoClientCreditFields({
        prompt: "Create a confident launch concept.",
        target_platforms: ["spotify"],
        walletBalance: 1_000_000,
      }),
    ).toThrow("walletBalance");
  });

  it("rejects nested platform prices", () => {
    expect(() =>
      assertNoClientCreditFields({
        prompt: "Create a confident launch concept.",
        target_platforms: [{ platform: "youtube", platformPrice: 0 }],
      }),
    ).toThrow("platformPrice");
  });

  it("accepts generation payloads without internal credit fields", () => {
    expect(() =>
      assertNoClientCreditFields({
        prompt: "Create a confident launch concept.",
        target_platforms: ["spotify"],
      }),
    ).not.toThrow();
  });
});

