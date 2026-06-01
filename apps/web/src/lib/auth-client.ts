"use client";

import { createAuthClient } from "better-auth/react";

type ClientMethod = (...args: any[]) => unknown;

const authClient = createAuthClient();

// Keep exported helper types stable.
// Better Auth's inferred client type references private package paths during
// Next.js build checks, so this module exposes only the small surface we use.
export const signInWithEmail: ClientMethod = authClient.signIn.email;
export const signUpWithEmail: ClientMethod = authClient.signUp.email;
export const signOut: ClientMethod = authClient.signOut;
export const useSession: ClientMethod = authClient.useSession;
