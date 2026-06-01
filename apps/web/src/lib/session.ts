export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

export type AuthenticatedSession = {
  user: AuthenticatedUser;
  session?: unknown;
};

export type SessionProvider = () => Promise<AuthenticatedSession | null>;

export class UnauthorizedError extends Error {
  readonly statusCode = 401;

  constructor() {
    super("Authentication is required.");
    this.name = "UnauthorizedError";
  }
}

export async function getServerSession(): Promise<AuthenticatedSession | null> {
  const [{ headers }, { auth }] = await Promise.all([
    import("next/headers"),
    import("./auth.js"),
  ]);

  return auth.api.getSession({
    headers: await headers(),
  }) as Promise<AuthenticatedSession | null>;
}

export async function requireSession(
  getSession: SessionProvider = getServerSession,
): Promise<AuthenticatedSession> {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return session;
}

export async function requireUserId(
  getSession: SessionProvider = getServerSession,
): Promise<string> {
  const session = await requireSession(getSession);
  return session.user.id;
}

