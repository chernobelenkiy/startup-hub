import { z } from "zod";

/**
 * Social Links Schema
 * Validates social media profile URLs/usernames
 */
export const socialLinksSchema = z.object({
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  github: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  telegram: z.string()
    .regex(/^[a-zA-Z0-9_]{5,32}$/, "Invalid Telegram username")
    .optional()
    .or(z.literal("")),
  instagram: z.string()
    .regex(/^[a-zA-Z0-9_.]{1,30}$/, "Invalid Instagram username")
    .optional()
    .or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
}).partial();

export type SocialLinks = z.infer<typeof socialLinksSchema>;

/**
 * Update Profile Schema
 * Validates user profile update requests
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  bio: z.string().max(1000, "Bio must be at most 1000 characters").optional().nullable(),
  title: z.string().max(100, "Title too long").optional().nullable(),
  company: z.string().max(100, "Company name too long").optional().nullable(),
  socialLinks: socialLinksSchema.optional().nullable(),
  openToContact: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Clean social links object by removing empty strings
 */
export function cleanSocialLinks(links: SocialLinks | null | undefined): SocialLinks | null {
  if (!links) return null;
  
  const cleaned: SocialLinks = {};
  
  for (const [key, value] of Object.entries(links)) {
    if (value && value.trim() !== "") {
      cleaned[key as keyof SocialLinks] = value;
    }
  }
  
  return Object.keys(cleaned).length > 0 ? cleaned : null;
}
