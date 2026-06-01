import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DB_VERSION } from "./index.js";

describe("db smoke", () => {
  it("exports version", () => {
    expect(DB_VERSION).toBe("1.0.0");
  });
});

describe("prisma schema", () => {
  const schema = readFileSync(
    fileURLToPath(new URL("../prisma/schema.prisma", import.meta.url)),
    "utf8",
  );

  it("defines Better Auth user, session, account, and verification models", () => {
    expect(schema).toContain('@@map("user")');
    expect(schema).toContain("model Session");
    expect(schema).toContain("model Account");
    expect(schema).toContain("model Verification");
  });

  it("keeps user email unique and relates sessions to users", () => {
    expect(schema).toContain("email         String   @unique");
    expect(schema).toContain("sessions           Session[]");
    expect(schema).toContain("userId    String");
    expect(schema).toContain("@@index([userId])");
  });

  it("defines user-owned generations with output uniqueness", () => {
    expect(schema).toContain("model GenerationRequest");
    expect(schema).toContain("userId         String");
    expect(schema).toContain("@@index([userId, status, createdAt])");
    expect(schema).toContain("@@unique([generationRequestId, platform])");
  });

  it("defines one wallet per user and idempotent credit ledger entries", () => {
    expect(schema).toContain("model CreditWallet");
    expect(schema).toContain("userId          String   @unique");
    expect(schema).toContain("model CreditLedgerEntry");
    expect(schema).toContain("idempotencyKey      String                @unique");
  });
});

describe("migration commands", () => {
  const packageJson = JSON.parse(
    readFileSync(
      fileURLToPath(new URL("../package.json", import.meta.url)),
      "utf8",
    ),
  ) as { scripts: Record<string, string> };

  it("exposes Prisma generate and migration scripts", () => {
    expect(packageJson.scripts["db:generate"]).toContain("prisma generate");
    expect(packageJson.scripts["db:migrate:create"]).toContain("--create-only");
    expect(packageJson.scripts["db:migrate:dev"]).toContain("migrate dev");
  });
});
