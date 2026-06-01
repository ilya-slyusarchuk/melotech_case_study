import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const globalForPrisma = globalThis as unknown as {
  melotechPrisma?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

export const prisma =
  globalForPrisma.melotechPrisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Next.js can reload modules often during local development.
// Reusing the client prevents opening a new database connection per reload.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.melotechPrisma = prisma;
}

export type PrismaDatabaseClient = PrismaClient;
