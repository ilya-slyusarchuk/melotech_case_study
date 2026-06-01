export function assertPositiveCreditAmount(amount: number): number {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Credit amount must be a positive integer.");
  }

  return amount;
}

