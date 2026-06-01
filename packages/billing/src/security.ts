const CLIENT_FORBIDDEN_CREDIT_FIELDS = new Set([
  "creditAmount",
  "credit_amount",
  "credits",
  "platformPrice",
  "platform_price",
  "walletBalance",
  "wallet_balance",
  "availableCredits",
  "available_credits",
  "reservedCredits",
  "reserved_credits",
]);

export function assertNoClientCreditFields(payload: unknown): void {
  const forbiddenField = findForbiddenCreditField(payload);

  if (forbiddenField) {
    throw new Error(
      `Frontend payload must not include internal credit field: ${forbiddenField}.`,
    );
  }
}

function findForbiddenCreditField(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedField = findForbiddenCreditField(item);
      if (nestedField) {
        return nestedField;
      }
    }

    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (CLIENT_FORBIDDEN_CREDIT_FIELDS.has(key)) {
      return key;
    }

    const nestedField = findForbiddenCreditField(nestedValue);
    if (nestedField) {
      return nestedField;
    }
  }

  return null;
}

