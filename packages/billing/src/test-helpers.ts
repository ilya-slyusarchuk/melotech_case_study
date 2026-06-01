import { CreditService } from "./service.js";
import { InMemoryCreditStore } from "./test-credit-store.js";

export function createService() {
  return new CreditService(new InMemoryCreditStore());
}

export async function createFundedService(userId: string, amount: number) {
  const service = createService();
  await service.createWalletForUser(userId);
  await service.grantCredits({
    userId,
    amount,
    idempotencyKey: `grant:${userId}:initial`,
  });
  return service;
}

export async function reserveAllPlatforms(
  service: CreditService,
  userId = "user_a",
  generationRequestId = "generation_1",
) {
  return service.reserveCreditsForGeneration({
    userId,
    generationRequestId,
    platforms: ["spotify", "tiktok", "youtube"],
    idempotencyKey: `reserve:${generationRequestId}`,
  });
}

