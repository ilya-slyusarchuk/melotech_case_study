"use client";

import { createAuthClient } from "better-auth/react";

type ClientMethod = (...args: any[]) => unknown;

/**
 * Stable user shape exposed by the auth client.
 *
 * Keeping this minimal avoids coupling to Better Auth internal types
 * that can break Next.js build checks.
 */
export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  session?: unknown;
};

const authClient = createAuthClient();

// Keep exported helper types stable.
// Better Auth's inferred client type references private package paths during
// Next.js build checks, so this module exposes only the small surface we use.
export const signInWithEmail: ClientMethod = authClient.signIn.email;
export const signUpWithEmail: ClientMethod = authClient.signUp.email;
export const signOut: ClientMethod = authClient.signOut;

/**
 * Typed wrapper around Better Auth's useSession hook.
 *
 * Returns an object with a typed `data` field so callers do not need
 * to cast the session shape everywhere.
 */
export function useSession(): {
  data: AuthSession | null;
  isPending: boolean;
} {
  // Better Auth useSession returns unknown at the type level.
  // We cast to the expected shape because the runtime contract is stable.
  return (
    authClient.useSession as () => {
      data: AuthSession | null;
      isPending: boolean;
    }
  )();
}
