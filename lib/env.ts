import { z } from "zod";

/**
 * Environment variable schema validation using Zod
 * This ensures all required environment variables are present and valid
 * at build/runtime. Fail fast if configuration is invalid.
 */

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // NextAuth.js
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters"),

  // OAuth Providers (optional - app works without them)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),

  // Vercel Blob Storage
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Parse and validate environment variables
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "Invalid environment variables:",
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
    );

    throw new Error(
      `Invalid environment variables: ${Object.keys(parsed.error.flatten().fieldErrors).join(", ")}`
    );
  }

  return parsed.data;
}

// Export validated environment variables
// In development, validate on first access
// In production, validate at startup
export const env = validateEnv();

// Type for the validated environment
export type Env = z.infer<typeof envSchema>;
