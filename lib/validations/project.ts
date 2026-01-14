import { z } from "zod";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/translations/project-translations";

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

export const languageSchema = z.enum(["en", "ru"]);

/** Schema for a single translation */
export const translationFieldsSchema = z.object({
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
    .max(10000, "Pitch must be at most 10000 characters"),
  traction: z.string().max(10000).optional().nullable(),
  investmentDetails: z.string().max(1000).optional().nullable(),
});

/** Schema for optional translation (used when language is not required) */
export const optionalTranslationFieldsSchema = z.object({
  title: z.string().max(100).optional(),
  shortDescription: z.string().max(280).optional(),
  pitch: z.string().max(10000).optional(),
  traction: z.string().max(10000).optional().nullable(),
  investmentDetails: z.string().max(1000).optional().nullable(),
});

/** Schema for translations object (keyed by language) */
export const translationsSchema = z.object({
  en: optionalTranslationFieldsSchema.optional(),
  ru: optionalTranslationFieldsSchema.optional(),
}).refine(
  (data) => {
    // At least one language must have complete translation
    const hasEn = data.en?.title && data.en?.shortDescription && data.en?.pitch;
    const hasRu = data.ru?.title && data.ru?.shortDescription && data.ru?.pitch;
    return hasEn || hasRu;
  },
  { message: "At least one complete translation (title, description, pitch) is required" }
);

/** Legacy schema for backward compatibility - creates project with single language */
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
    .max(10000, "Pitch must be at most 10000 characters"),
  websiteUrl: z.string().url("Must be a valid URL").optional().nullable(),
  screenshotUrl: z.string().url("Must be a valid URL").optional().nullable(),
  status: projectStatusSchema.default("IDEA"),
  estimatedLaunch: z.coerce.date().optional().nullable(),
  traction: z.string().max(10000).optional().nullable(),
  needsInvestment: z.boolean().default(false),
  investmentDetails: z.string().max(1000).optional().nullable(),
  teamMembers: z.array(teamMemberSchema).default([]),
  lookingFor: z.array(z.string()).default([]),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").default([]),
  language: languageSchema.default("ru"),
});

/** Schema for creating project with translations */
export const createProjectWithTranslationsSchema = z.object({
  translations: translationsSchema,
  websiteUrl: z.string().url("Must be a valid URL").optional().nullable(),
  screenshotUrl: z.string().url("Must be a valid URL").optional().nullable(),
  status: projectStatusSchema.default("IDEA"),
  estimatedLaunch: z.coerce.date().optional().nullable(),
  needsInvestment: z.boolean().default(false),
  teamMembers: z.array(teamMemberSchema).default([]),
  lookingFor: z.array(z.string()).default([]),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

/** Schema for updating a single translation */
export const updateTranslationSchema = z.object({
  language: languageSchema,
  title: z.string().min(3).max(100).optional(),
  shortDescription: z.string().min(10).max(280).optional(),
  pitch: z.string().min(20).max(10000).optional(),
  traction: z.string().max(10000).optional().nullable(),
  investmentDetails: z.string().max(1000).optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateProjectWithTranslationsInput = z.infer<typeof createProjectWithTranslationsSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateTranslationInput = z.infer<typeof updateTranslationSchema>;
export type TranslationFields = z.infer<typeof translationFieldsSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export { SupportedLanguage, SUPPORTED_LANGUAGES };
