export type DatabaseHealthClient = {
  $queryRaw<T = unknown>(query: TemplateStringsArray): Promise<T>;
};

export type DatabaseHealthResult = {
  ok: boolean;
  message: string;
};

export async function checkDatabaseHealth(
  client: DatabaseHealthClient,
): Promise<DatabaseHealthResult> {
  try {
    await client.$queryRaw`SELECT 1`;
    return { ok: true, message: "Database connection succeeded." };
  } catch {
    return { ok: false, message: "Database connection failed." };
  }
}

