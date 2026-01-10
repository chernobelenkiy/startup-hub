import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
  formatRetryTime,
} from "@/lib/login-rate-limit";

/**
 * Credentials validation schema
 * - Email must be valid
 * - Password must be at least 8 characters with at least 1 number
 */
const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least 1 number"),
});

/**
 * NextAuth v5 (Auth.js) configuration
 * Using Credentials provider with Prisma adapter and JWT session strategy
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        // Validate credentials with Zod
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        // Use email as the rate limit identifier (more reliable than IP in serverless)
        const rateLimitKey = `login:${normalizedEmail}`;

        // Check rate limit before attempting login
        const rateLimitStatus = checkLoginRateLimit(rateLimitKey);

        if (!rateLimitStatus.allowed) {
          const retryTime = formatRetryTime(rateLimitStatus.retryAfterSeconds ?? 900);
          throw new Error(`Too many login attempts. Please try again in ${retryTime}.`);
        }

        // Look up user by email
        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            avatarUrl: true,
            locale: true,
            // We need to get the password hash from Account
            accounts: {
              where: { provider: "credentials" },
              select: { access_token: true },
            },
          },
        });

        if (!user || !user.accounts[0]?.access_token) {
          // User not found or no password set - record failed attempt
          recordFailedLoginAttempt(rateLimitKey);
          return null;
        }

        // Compare password with bcrypt
        const passwordHash = user.accounts[0].access_token;
        const isValidPassword = await bcrypt.compare(password, passwordHash);

        if (!isValidPassword) {
          // Invalid password - record failed attempt
          const status = recordFailedLoginAttempt(rateLimitKey);

          // If this attempt triggered a lockout, throw with specific message
          if (!status.allowed) {
            const retryTime = formatRetryTime(status.retryAfterSeconds ?? 900);
            throw new Error(`Too many login attempts. Please try again in ${retryTime}.`);
          }

          return null;
        }

        // Successful login - reset the rate limit counter
        recordSuccessfulLogin(rateLimitKey);

        // Return user object (without password hash)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image ?? user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * JWT callback - Add user id to token
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    /**
     * Session callback - Add user id to session
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

/**
 * Type augmentation for NextAuth v5
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }

  interface JWT {
    id?: string;
  }
}
