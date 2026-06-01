"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const signInWithEmail = authClient.signIn.email;
export const signUpWithEmail = authClient.signUp.email;
export const signOut = authClient.signOut;
export const useSession = authClient.useSession;

