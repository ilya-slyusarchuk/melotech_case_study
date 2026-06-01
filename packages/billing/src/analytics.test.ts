import { describe, expect, it } from "vitest";
import { CreditService } from "./index.js";
import { InMemoryCreditStore } from "./test-credit-store.js";
import { reserveAllPlatforms } from "./test-helpers.js";

describe("usage analytics", () => {
  it("groups daily, weekly, and monthly capture usage", async () => {
    const { service, reservation } = await setupAnalyticsCaptures();

    expect(reservation.reservedCredits).toBe(6);
    expect(await service.readUsageAnalytics("user_a", "daily")).toEqual([
      { period: "2026-05-31", consumedCredits: 1 },
      { period: "2026-06-01", consumedCredits: 2 },
      { period: "2026-06-08", consumedCredits: 3 },
    ]);
    expect(await service.readUsageAnalytics("user_a", "weekly")).toEqual([
      { period: "2026-05-25", consumedCredits: 1 },
      { period: "2026-06-01", consumedCredits: 2 },
      { period: "2026-06-08", consumedCredits: 3 },
    ]);
    expect(await service.readUsageAnalytics("user_a", "monthly")).toEqual([
      { period: "2026-05", consumedCredits: 1 },
      { period: "2026-06", consumedCredits: 5 },
    ]);
  });

  it("excludes grants, holds, releases, and other users from usage", async () => {
    const { service } = await setupAnalyticsCaptures();

    const releaseOnlyReservation = await service.reserveCreditsForGeneration({
      userId: "user_a",
      generationRequestId: "generation_3",
      platforms: ["spotify", "tiktok"],
      idempotencyKey: "reserve:generation_3",
    });
    await service.releaseUnusedReservedCredits({
      userId: "user_a",
      reservationId: releaseOnlyReservation.id,
      idempotencyKey: "release:generation_3",
    });
    await addOtherUserCapture(service);

    expect(await service.readUsageAnalytics("user_a", "monthly")).toEqual([
      { period: "2026-05", consumedCredits: 1 },
      { period: "2026-06", consumedCredits: 5 },
    ]);
  });
});

async function setupAnalyticsCaptures() {
  const store = new InMemoryCreditStore();
  const service = new CreditService(store);
  await service.createWalletForUser("user_a");
  await service.grantCredits({
    userId: "user_a",
    amount: 100,
    idempotencyKey: "grant:user_a:initial",
  });
  const reservation = await reserveAllPlatforms(service);

  await capturePlatform(service, reservation.id, "spotify");
  store.setLedgerCreatedAt(
    "capture:generation_1:spotify",
    new Date("2026-05-31T12:00:00.000Z"),
  );
  await capturePlatform(service, reservation.id, "tiktok");
  store.setLedgerCreatedAt(
    "capture:generation_1:tiktok",
    new Date("2026-06-01T12:00:00.000Z"),
  );
  await capturePlatform(service, reservation.id, "youtube");
  store.setLedgerCreatedAt(
    "capture:generation_1:youtube",
    new Date("2026-06-08T12:00:00.000Z"),
  );

  return { service, reservation };
}

async function capturePlatform(
  service: CreditService,
  reservationId: string,
  platform: "spotify" | "tiktok" | "youtube",
) {
  return service.captureCreditsForSuccessfulPlatform({
    userId: "user_a",
    reservationId,
    platform,
    outputStored: true,
    idempotencyKey: `capture:generation_1:${platform}`,
  });
}

async function addOtherUserCapture(service: CreditService) {
  await service.createWalletForUser("user_b");
  await service.grantCredits({
    userId: "user_b",
    amount: 100,
    idempotencyKey: "grant:user_b:initial",
  });
  const reservation = await reserveAllPlatforms(
    service,
    "user_b",
    "generation_2",
  );

  await service.captureCreditsForSuccessfulPlatform({
    userId: "user_b",
    reservationId: reservation.id,
    platform: "youtube",
    outputStored: true,
    idempotencyKey: "capture:generation_2:youtube",
  });
}
