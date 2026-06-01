import { defineConfig } from "prisma/config";

const fallbackDatabaseUrl =
  "postgresql://melotech:melotech_secret@localhost:5432/melotech";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Prisma generate does not need a live database connection.
    // The fallback keeps client generation usable before local env is loaded.
    url: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
  },
});
