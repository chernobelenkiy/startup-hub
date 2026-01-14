/**
 * Project Translation Utilities
 *
 * Helper functions for managing multilingual project content.
 */

import type { Project, ProjectTranslation } from "@/lib/db";

/** Supported languages for project translations */
export type SupportedLanguage = "en" | "ru";

/** Default fallback language */
export const DEFAULT_LANGUAGE: SupportedLanguage = "ru";

/** Available languages */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "ru"];

/** Translation fields that can be localized */
export interface TranslatableFields {
  title: string;
  shortDescription: string;
  pitch: string;
  traction: string | null;
  investmentDetails: string | null;
}

/** Project with translations included */
export type ProjectWithTranslations = Project & {
  translations: ProjectTranslation[];
};

/** Resolved project with translation fields merged */
export type ResolvedProject = Omit<
  Project,
  "title" | "shortDescription" | "pitch" | "traction" | "investmentDetails"
> & {
  title: string;
  shortDescription: string;
  pitch: string;
  traction: string | null;
  investmentDetails: string | null;
  language: string;
  translations: ProjectTranslation[];
};

/**
 * Gets the best available translation for a project based on the requested locale.
 * Fallback order: requested locale -> Russian -> first available translation
 *
 * @param translations - Array of available translations
 * @param locale - Requested locale
 * @returns The best matching translation or undefined if none available
 */
export function getBestTranslation(
  translations: ProjectTranslation[],
  locale: string
): ProjectTranslation | undefined {
  if (!translations || translations.length === 0) {
    return undefined;
  }

  // Try to find exact locale match
  const exactMatch = translations.find((t) => t.language === locale);
  if (exactMatch) {
    return exactMatch;
  }

  // Fall back to Russian
  const russianFallback = translations.find((t) => t.language === "ru");
  if (russianFallback) {
    return russianFallback;
  }

  // Fall back to first available translation
  return translations[0];
}

/**
 * Resolves a project with translations into a single object with the best translation.
 * Falls back to project's own fields if no translations are available.
 */
export function resolveProjectTranslation(
  project: ProjectWithTranslations,
  locale: string = DEFAULT_LANGUAGE
): ResolvedProject {
  const translation = getBestTranslation(project.translations, locale);

  return {
    ...project,
    title: translation?.title ?? project.title ?? "",
    shortDescription: translation?.shortDescription ?? project.shortDescription ?? "",
    pitch: translation?.pitch ?? project.pitch ?? "",
    traction: translation?.traction ?? project.traction,
    investmentDetails: translation?.investmentDetails ?? project.investmentDetails,
    language: translation?.language ?? project.language,
  };
}

/**
 * Gets all available languages for a project.
 */
export function getAvailableLanguages(
  translations: ProjectTranslation[]
): SupportedLanguage[] {
  return translations
    .map((t) => t.language as SupportedLanguage)
    .filter((lang) => SUPPORTED_LANGUAGES.includes(lang));
}
