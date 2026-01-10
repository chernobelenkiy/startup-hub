import { z } from "zod";

/**
 * Auth validation schemas
 * Used for form validation and API request validation
 */

/**
 * Password validation rules:
 * - Minimum 8 characters
 * - At least 1 number
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/\d/, "Password must contain at least 1 number");

/**
 * Sign in schema
 */
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
});

/**
 * Registration schema with password confirmation
 */
export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * API Token schema
 */
export const apiTokenSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),
  permissions: z
    .array(z.enum(["read", "create", "update", "delete"]))
    .min(1, "At least one permission is required")
    .default(["read"]),
  expiresAt: z.coerce.date().optional().nullable(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ApiTokenInput = z.infer<typeof apiTokenSchema>;
