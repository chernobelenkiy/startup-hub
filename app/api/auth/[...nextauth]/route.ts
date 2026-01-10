import { handlers } from "@/lib/auth";

/**
 * NextAuth v5 API route handlers
 * Handles all /api/auth/* requests (signin, signout, callback, session, etc.)
 */
export const { GET, POST } = handlers;
