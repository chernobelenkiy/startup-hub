"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: React.ReactNode;
}

/**
 * Client-side session provider wrapper
 * Provides session context for useSession hook
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
