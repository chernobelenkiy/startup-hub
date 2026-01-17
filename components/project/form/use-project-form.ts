"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { TranslationData } from "./translation-fields";
import type { ProjectStatus } from "@/lib/db";
import type { TeamMember, CreateProjectWithTranslationsInput } from "@/lib/validations/project";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/translations/project-translations";

/** Initial data can include translations array from API */
export interface ProjectFormInitialData {
  title?: string;
  shortDescription?: string;
  pitch?: string;
  traction?: string;
  investmentDetails?: string;
  language?: string;
  websiteUrl?: string | null;
  status?: ProjectStatus;
  tags?: string[];
  lookingFor?: string[];
  needsInvestment?: boolean;
  teamMembers?: TeamMember[];
  estimatedLaunch?: Date | string | null;
  screenshotUrl?: string | null;
  visible?: boolean;
  translations?: Array<{
    language: string;
    title: string;
    shortDescription: string;
    pitch: string;
    features: string | null;
    traction: string | null;
    investmentDetails: string | null;
  }>;
}

const emptyTranslation: TranslationData = {
  title: "",
  shortDescription: "",
  pitch: "",
  features: "",
  traction: "",
  investmentDetails: "",
};

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Custom hook for managing project form state and validation
 * Extracts complex state management from ProjectForm component
 */
export function useProjectForm(initialData?: ProjectFormInitialData) {
  const tErrors = useTranslations("errors");
  const tTranslations = useTranslations("translations");

  // Build initial translations from initialData
  const buildInitialTranslations = useCallback((): Record<SupportedLanguage, TranslationData> => {
    const result: Record<SupportedLanguage, TranslationData> = {
      en: { ...emptyTranslation },
      ru: { ...emptyTranslation },
    };

    // First, try to populate from translations array
    if (initialData?.translations) {
      for (const trans of initialData.translations) {
        const lang = trans.language as SupportedLanguage;
        if (SUPPORTED_LANGUAGES.includes(lang)) {
          result[lang] = {
            title: trans.title || "",
            shortDescription: trans.shortDescription || "",
            pitch: trans.pitch || "",
            features: trans.features || "",
            traction: trans.traction || "",
            investmentDetails: trans.investmentDetails || "",
          };
        }
      }
    }

    // Fallback: if no translations (or empty array) but legacy fields exist, use those
    if ((!initialData?.translations || initialData.translations.length === 0) && initialData?.title) {
      const lang = (initialData.language || "ru") as SupportedLanguage;
      result[lang] = {
        title: initialData.title || "",
        shortDescription: initialData.shortDescription || "",
        pitch: initialData.pitch || "",
        features: "",
        traction: initialData.traction || "",
        investmentDetails: initialData.investmentDetails || "",
      };
    }

    return result;
  }, [initialData]);

  // Active language tab
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>("ru");

  // Translations state for each language
  const [translations, setTranslations] = useState<Record<SupportedLanguage, TranslationData>>(
    buildInitialTranslations
  );

  // Non-translatable form state
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.websiteUrl || "");
  const [status, setStatus] = useState<ProjectStatus>(initialData?.status || "IDEA");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [lookingFor, setLookingFor] = useState<string[]>(initialData?.lookingFor || []);
  const [needsInvestment, setNeedsInvestment] = useState(initialData?.needsInvestment || false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    (initialData?.teamMembers as TeamMember[]) || []
  );
  const [estimatedLaunch, setEstimatedLaunch] = useState(
    initialData?.estimatedLaunch
      ? new Date(initialData.estimatedLaunch).toISOString().split("T")[0]
      : ""
  );
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(
    initialData?.screenshotUrl || null
  );
  const [visible, setVisible] = useState(
    initialData?.visible !== undefined ? initialData.visible : true
  );

  // Validation errors (per language)
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({
    en: {},
    ru: {},
    general: {},
  });

  // Update a specific translation field
  const updateTranslation = useCallback(
    (lang: SupportedLanguage, field: keyof TranslationData, value: string) => {
      setTranslations((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          [field]: value,
        },
      }));
    },
    []
  );

  // Check if a language has complete translation
  const isLanguageComplete = useCallback(
    (lang: SupportedLanguage): boolean => {
      const trans = translations[lang];
      return !!(
        trans.title.trim() &&
        trans.title.length >= 3 &&
        trans.shortDescription.trim() &&
        trans.shortDescription.length >= 10 &&
        trans.pitch.trim() &&
        trans.pitch.length >= 20
      );
    },
    [translations]
  );

  // Get completed languages
  const completedLanguages = useMemo(
    () => SUPPORTED_LANGUAGES.filter(isLanguageComplete),
    [isLanguageComplete]
  );

  const validateTranslation = useCallback(
    (lang: SupportedLanguage): Record<string, string> => {
      const trans = translations[lang];
      const langErrors: Record<string, string> = {};

      if (trans.title.trim() || trans.shortDescription.trim() || trans.pitch.trim()) {
        // If any field is filled, validate all required fields
        if (!trans.title.trim() || trans.title.length < 3) {
          langErrors.title = tErrors("minLength", { min: 3 });
        }
        if (trans.title.length > 100) {
          langErrors.title = tErrors("maxLength", { max: 100 });
        }
        if (!trans.shortDescription.trim() || trans.shortDescription.length < 10) {
          langErrors.shortDescription = tErrors("minLength", { min: 10 });
        }
        if (trans.shortDescription.length > 280) {
          langErrors.shortDescription = tErrors("maxLength", { max: 280 });
        }
        if (!trans.pitch.trim() || trans.pitch.length < 20) {
          langErrors.pitch = tErrors("minLength", { min: 20 });
        }
        if (trans.pitch.length > 10000) {
          langErrors.pitch = tErrors("maxLength", { max: 10000 });
        }
      }

      return langErrors;
    },
    [translations, tErrors]
  );

  const validate = useCallback((): boolean => {
    // Validate all translations
    const newErrors: Record<string, Record<string, string>> = {
      en: validateTranslation("en"),
      ru: validateTranslation("ru"),
      general: {},
    };

    // Check that at least one complete translation exists
    const hasComplete = completedLanguages.length > 0;
    if (!hasComplete) {
      // Add error to the active language if none is complete
      newErrors[activeLanguage] = {
        ...newErrors[activeLanguage],
        general: tTranslations("atLeastOneRequired"),
      };
    }

    // Check for website URL
    if (websiteUrl && !isValidUrl(websiteUrl)) {
      newErrors.general = { websiteUrl: tErrors("invalidUrl") };
    }

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(
      (langErrors) => Object.keys(langErrors).length > 0
    );

    if (hasErrors) {
      setErrors(newErrors);
      // Switch to the first language with errors
      for (const lang of SUPPORTED_LANGUAGES) {
        if (Object.keys(newErrors[lang] || {}).length > 0) {
          setActiveLanguage(lang);
          break;
        }
      }
      return false;
    }

    setErrors({ en: {}, ru: {}, general: {} });
    return true;
  }, [
    validateTranslation,
    completedLanguages,
    activeLanguage,
    websiteUrl,
    tTranslations,
    tErrors,
  ]);

  const buildSubmitData = useCallback((): CreateProjectWithTranslationsInput & {
    screenshotUrl?: string | null;
  } => {
    // Build translations object for submission
    const submittedTranslations: CreateProjectWithTranslationsInput["translations"] = {};

    for (const lang of SUPPORTED_LANGUAGES) {
      if (isLanguageComplete(lang)) {
        submittedTranslations[lang] = {
          title: translations[lang].title.trim(),
          shortDescription: translations[lang].shortDescription.trim(),
          pitch: translations[lang].pitch.trim(),
          features: translations[lang].features.trim() || null,
          traction: translations[lang].traction.trim() || null,
          investmentDetails: needsInvestment
            ? translations[lang].investmentDetails.trim() || null
            : null,
        };
      }
    }

    return {
      translations: submittedTranslations,
      websiteUrl: websiteUrl.trim() || null,
      status,
      tags,
      lookingFor,
      needsInvestment,
      teamMembers,
      estimatedLaunch: estimatedLaunch ? new Date(estimatedLaunch) : null,
      screenshotUrl,
      visible,
    };
  }, [
    translations,
    isLanguageComplete,
    websiteUrl,
    status,
    tags,
    lookingFor,
    needsInvestment,
    teamMembers,
    estimatedLaunch,
    screenshotUrl,
    visible,
  ]);

  return {
    // Language state
    activeLanguage,
    setActiveLanguage,
    translations,
    updateTranslation,
    completedLanguages,

    // Metadata state
    websiteUrl,
    setWebsiteUrl,
    status,
    setStatus,
    tags,
    setTags,
    lookingFor,
    setLookingFor,
    needsInvestment,
    setNeedsInvestment,
    teamMembers,
    setTeamMembers,
    estimatedLaunch,
    setEstimatedLaunch,
    screenshotUrl,
    setScreenshotUrl,
    visible,
    setVisible,

    // Validation
    errors,
    validate,

    // Submit helper
    buildSubmitData,
  };
}
