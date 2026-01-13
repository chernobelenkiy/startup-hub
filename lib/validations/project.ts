import { z } from "zod";

/**
 * Project validation schemas
 * Used for form validation and API request validation
 */

export const projectStatusSchema = z.enum([
  "IDEA",
  "MVP",
  "BETA",
  "LAUNCHED",
  "PAUSED",
]);

export const teamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  avatarUrl: z.string().url().optional().nullable(),
});

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters"),
  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(280, "Short description must be at most 280 characters"),
  pitch: z
    .string()
    .min(20, "Pitch must be at least 20 characters")
    .max(500, "Pitch must be at most 500 characters"),
  websiteUrl: z.string().url("Must be a valid URL").optional().nullable(),
  screenshotUrl: z.string().url("Must be a valid URL").optional().nullable(),
  status: projectStatusSchema.default("IDEA"),
  estimatedLaunch: z.coerce.date().optional().nullable(),
  traction: z.string().max(2000).optional().nullable(),
  needsInvestment: z.boolean().default(false),
  investmentDetails: z.string().max(1000).optional().nullable(),
  teamMembers: z.array(teamMemberSchema).default([]),
  lookingFor: z.array(z.string()).default([]),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").default([]),
  language: z.enum(["en", "ru"]).default("en"),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
