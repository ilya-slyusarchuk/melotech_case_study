import { describe, expect, it } from "vitest";
import { type CreditService } from "./index.js";
import {
  createFundedService,
  createService,
  reserveAllPlatforms,
} from "./test-helpers.js";

describe("credit service wallet and ledger behavior", () => {
  it("creates a wallet with zero balances", async () => {
    const service = createService();
    const wallet = await service.createWalletForUser("user_a");

    expect(wallet).toMatchObject({
      userId: "user_a",
      availableCredits: 0,
      reservedCredits: 0,
    });
  });

  it("prevents more than one wallet per user", async () => {
    const service = createService();
    await service.createWalletForUser("user_a");

    await expect(service.createWalletForUser("user_a")).rejects.toThrow(
      "already has",
    );
  });

  it("creates a unique grant ledger entry", async () => {
    const service = createService();
    await service.createWalletForUser("user_a");

    const entry = await service.grantCredits({
      userId: "user_a",
      amount: 25,
      idempotencyKey: "grant:user_a:1",
    });

    expect(entry).toMatchObject({
      type: "grant",
      amount: 25,
      idempotencyKey: "grant:user_a:1",
    });
  });

  it("reads user-scoped ledger history", async () => {
    const service = createService();
    await service.createWalletForUser("user_a");
    await grant25(service);

    await expect(service.readLedgerHistory("user_a")).resolves.toHaveLength(1);
  });

  it("does not double apply a duplicate grant idempotency key", async () => {
    const service = createService();
    await service.createWalletForUser("user_a");

    await grant25(service);
    await grant25(service);

    await expectBalance(service, "user_a", 25, 0);
  });

  it("creates a credit reservation linked to a generation", async () => {
    const service = await createFundedService("user_a", 100);

    const reservation = await service.reserveCreditsForGeneration({
      userId: "user_a",
      generationRequestId: "generation_1",
      platforms: ["spotify", "youtube"],
      idempotencyKey: "reserve:generation_1",
    });

    expect(reservation).toMatchObject({
      userId: "user_a",
      generationRequestId: "generation_1",
      reservedCredits: 4,
      status: "active",
    });
  });
});

describe("credit service balance mutations", () => {
  it("grants credits and increases available balance", async () => {
    const service = await createFundedService("user_a", 40);
    await expectBalance(service, "user_a", 40, 0);
  });

  it("reservation moves credits from available to reserved", async () => {
    const service = await createFundedService("user_a", 100);

    await service.reserveCreditsForGeneration({
      userId: "user_a",
      generationRequestId: "generation_1",
      platforms: ["spotify", "tiktok"],
      idempotencyKey: "reserve:generation_1",
    });

    await expectBalance(service, "user_a", 97, 3);
  });

  it("reservation fails when available credits are insufficient", async () => {
    const service = await createFundedService("user_a", 1);

    await expect(
      service.reserveCreditsForGeneration({
        userId: "user_a",
        generationRequestId: "generation_1",
        platforms: ["youtube"],
        idempotencyKey: "reserve:generation_1",
      }),
    ).rejects.toThrow("Insufficient available credits");
  });

  it("captures platform credits after successful output storage", async () => {
    const service = await createFundedService("user_a", 100);
    const reservation = await reserveAllPlatforms(service);

    const entry = await service.captureCreditsForSuccessfulPlatform({
      userId: "user_a",
      reservationId: reservation.id,
      platform: "tiktok",
      outputStored: true,
      idempotencyKey: "capture:generation_1:tiktok",
    });

    expect(entry).toMatchObject({
      type: "platform_capture",
      amount: 2,
      platform: "tiktok",
    });
    await expectBalance(service, "user_a", 94, 4);
  });

  it("does not capture failed platform outputs", async () => {
    const service = await createFundedService("user_a", 100);
    const reservation = await reserveAllPlatforms(service);

    const entry = await service.captureCreditsForSuccessfulPlatform({
      userId: "user_a",
      reservationId: reservation.id,
      platform: "youtube",
      outputStored: false,
      idempotencyKey: "capture:generation_1:youtube",
    });

    expect(entry).toBeNull();
    await expectBalance(service, "user_a", 94, 6);
  });

  it("duplicate capture idempotency key does not double charge", async () => {
    const service = await createFundedService("user_a", 100);
    const reservation = await reserveAllPlatforms(service);
    const input = {
      userId: "user_a",
      reservationId: reservation.id,
      platform: "spotify" as const,
      outputStored: true,
      idempotencyKey: "capture:generation_1:spotify",
    };

    await service.captureCreditsForSuccessfulPlatform(input);
    await service.captureCreditsForSuccessfulPlatform(input);

    await expectBalance(service, "user_a", 94, 5);
  });

  it("re-processing a completed platform does not capture twice", async () => {
    const service = await createFundedService("user_a", 100);
    const reservation = await reserveAllPlatforms(service);

    await captureYoutube(service, reservation.id, "first");
    await captureYoutube(service, reservation.id, "retry");

    await expectBalance(service, "user_a", 94, 3);
  });

  it("releases unused reserved credits back to available", async () => {
    const service = await createFundedService("user_a", 100);
    const reservation = await reserveAllPlatforms(service);
    await service.captureCreditsForSuccessfulPlatform({
      userId: "user_a",
      reservationId: reservation.id,
      platform: "spotify",
      outputStored: true,
      idempotencyKey: "capture:generation_1:spotify",
    });

    const entry = await service.releaseUnusedReservedCredits({
      userId: "user_a",
      reservationId: reservation.id,
      idempotencyKey: "release:generation_1",
    });

    expect(entry).toMatchObject({ type: "reservation_release", amount: 5 });
    await expectBalance(service, "user_a", 99, 0);
  });

  it("duplicate release idempotency key does not double release", async () => {
    const service = await createFundedService("user_a", 100);
    const reservation = await reserveAllPlatforms(service);
    const input = {
      userId: "user_a",
      reservationId: reservation.id,
      idempotencyKey: "release:generation_1",
    };

    await service.releaseUnusedReservedCredits(input);
    await service.releaseUnusedReservedCredits(input);

    await expectBalance(service, "user_a", 100, 0);
  });
});

describe("signup wallet creation", () => {
  it("ensures a new user receives an empty wallet", async () => {
    const service = createService();
    const wallet = await service.ensureWalletForUser("user_a");

    expect(wallet.availableCredits).toBe(0);
  });

  it("ensure wallet is idempotent", async () => {
    const service = createService();
    const firstWallet = await service.ensureWalletForUser("user_a");
    const secondWallet = await service.ensureWalletForUser("user_a");

    expect(secondWallet.id).toBe(firstWallet.id);
    await expectBalance(service, "user_a", 0, 0);
  });
});

async function grant25(service: CreditService) {
  return service.grantCredits({
    userId: "user_a",
    amount: 25,
    idempotencyKey: "grant:user_a:1",
  });
}

async function captureYoutube(
  service: CreditService,
  reservationId: string,
  suffix: string,
) {
  return service.captureCreditsForSuccessfulPlatform({
    userId: "user_a",
    reservationId,
    platform: "youtube",
    outputStored: true,
    idempotencyKey: `capture:generation_1:youtube:${suffix}`,
  });
}

async function expectBalance(
  service: CreditService,
  userId: string,
  availableCredits: number,
  reservedCredits: number,
) {
  await expect(service.readWalletBalance(userId)).resolves.toMatchObject({
    availableCredits,
    reservedCredits,
  });
}
