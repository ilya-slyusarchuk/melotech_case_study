import { describe, expect, it } from "vitest";
import {
  calculateReservationCost,
  getPlatformCreditCost,
  parsePlatformForPricing,
} from "./index.js";

describe("platform credit pricing", () => {
  it("prices Spotify at 1 credit", () => {
    expect(getPlatformCreditCost("spotify")).toBe(1);
  });

  it("prices TikTok at 2 credits", () => {
    expect(getPlatformCreditCost("tiktok")).toBe(2);
  });

  it("prices YouTube at 3 credits", () => {
    expect(getPlatformCreditCost("youtube")).toBe(3);
  });

  it("prices all three platforms at 6 total credits", () => {
    expect(calculateReservationCost(["spotify", "tiktok", "youtube"])).toBe(6);
  });

  it("rejects duplicate platforms before pricing", () => {
    expect(() => calculateReservationCost(["spotify", "spotify"])).toThrow(
      "Duplicate platforms",
    );
  });

  it("rejects unsupported platforms before pricing", () => {
    expect(() => parsePlatformForPricing("instagram")).toThrow(
      "Unsupported platform",
    );
  });
});

