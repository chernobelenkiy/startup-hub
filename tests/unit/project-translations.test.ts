import { describe, it, expect } from "vitest";
import {
  getBestTranslation,
  resolveProjectTranslation,
  getAvailableLanguages,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type ProjectWithTranslations,
} from "@/lib/translations/project-translations";
import type { ProjectTranslation } from "@/lib/db";

/**
 * Unit Tests for Project Translation Utilities
 *
 * Test Cases Covered:
 * - TC-TRANS-001: getBestTranslation returns exact locale match (P0)
 * - TC-TRANS-002: getBestTranslation falls back to Russian when locale not found (P0)
 * - TC-TRANS-003: getBestTranslation falls back to first translation when no Russian (P1)
 * - TC-TRANS-004: getBestTranslation returns undefined for empty array (P0)
 * - TC-TRANS-005: resolveProjectTranslation merges translation with project (P0)
 * - TC-TRANS-006: resolveProjectTranslation falls back to legacy fields (P0)
 * - TC-TRANS-007: getAvailableLanguages returns supported languages only (P1)
 * - TC-TRANS-008: getAvailableLanguages filters out unsupported languages (P1)
 */

// Helper to create mock ProjectTranslation
function createMockTranslation(
  language: string,
  overrides?: Partial<ProjectTranslation>
): ProjectTranslation {
  return {
    id: `trans-${language}`,
    projectId: "test-project-id",
    language,
    title: `Title in ${language}`,
    shortDescription: `Short description in ${language}`,
    pitch: `Pitch content in ${language}`,
    traction: null,
    investmentDetails: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ProjectTranslation;
}

// Helper to create mock ProjectWithTranslations
function createMockProjectWithTranslations(
  translations: ProjectTranslation[],
  overrides?: Partial<ProjectWithTranslations>
): ProjectWithTranslations {
  return {
    id: "test-project-id",
    slug: "test-project",
    ownerId: "test-user-id",
    title: "Legacy Title",
    shortDescription: "Legacy short description",
    pitch: "Legacy pitch content",
    traction: null,
    investmentDetails: null,
    websiteUrl: null,
    screenshotUrl: null,
    status: "IDEA",
    estimatedLaunch: null,
    needsInvestment: false,
    teamMembers: [],
    lookingFor: [],
    tags: [],
    likesCount: 0,
    language: "ru",
    createdAt: new Date(),
    updatedAt: new Date(),
    translations,
    ...overrides,
  } as ProjectWithTranslations;
}

describe("Project Translation Utilities", () => {
  describe("Constants", () => {
    it("has Russian as default language", () => {
      expect(DEFAULT_LANGUAGE).toBe("ru");
    });

    it("supports English and Russian languages", () => {
      expect(SUPPORTED_LANGUAGES).toContain("en");
      expect(SUPPORTED_LANGUAGES).toContain("ru");
      expect(SUPPORTED_LANGUAGES).toHaveLength(2);
    });
  });

  describe("getBestTranslation", () => {
    // TC-TRANS-001: Returns exact locale match when available
    it("returns translation matching exact locale (en)", () => {
      const translations = [
        createMockTranslation("ru"),
        createMockTranslation("en"),
      ];

      const result = getBestTranslation(translations, "en");

      expect(result).toBeDefined();
      expect(result?.language).toBe("en");
      expect(result?.title).toBe("Title in en");
    });

    it("returns translation matching exact locale (ru)", () => {
      const translations = [
        createMockTranslation("ru"),
        createMockTranslation("en"),
      ];

      const result = getBestTranslation(translations, "ru");

      expect(result).toBeDefined();
      expect(result?.language).toBe("ru");
      expect(result?.title).toBe("Title in ru");
    });

    // TC-TRANS-002: Falls back to Russian when requested locale not found
    it("falls back to Russian when locale en is requested but only ru exists", () => {
      const translations = [createMockTranslation("ru")];

      const result = getBestTranslation(translations, "en");

      expect(result).toBeDefined();
      expect(result?.language).toBe("ru");
    });

    it("falls back to Russian for any unsupported locale", () => {
      const translations = [
        createMockTranslation("ru"),
        createMockTranslation("en"),
      ];

      const result = getBestTranslation(translations, "fr");

      expect(result).toBeDefined();
      expect(result?.language).toBe("ru");
    });

    it("falls back to Russian for locale variations (en-US)", () => {
      const translations = [createMockTranslation("ru")];

      const result = getBestTranslation(translations, "en-US");

      expect(result).toBeDefined();
      expect(result?.language).toBe("ru");
    });

    // TC-TRANS-003: Falls back to first translation when no Russian
    it("falls back to first available translation when Russian not available", () => {
      const translations = [createMockTranslation("en")];

      const result = getBestTranslation(translations, "fr");

      expect(result).toBeDefined();
      expect(result?.language).toBe("en");
    });

    it("returns first translation when requesting unsupported locale and no Russian", () => {
      const translations = [
        createMockTranslation("en"),
        createMockTranslation("de"), // hypothetical unsupported language
      ];

      const result = getBestTranslation(translations, "zh");

      expect(result).toBeDefined();
      expect(result?.language).toBe("en"); // First in array
    });

    // TC-TRANS-004: Returns undefined for empty array
    it("returns undefined for empty translations array", () => {
      const result = getBestTranslation([], "en");

      expect(result).toBeUndefined();
    });

    it("returns undefined when translations is null-like", () => {
      // Testing defensive behavior
      const result = getBestTranslation(null as unknown as ProjectTranslation[], "en");

      expect(result).toBeUndefined();
    });

    it("returns undefined when translations is undefined-like", () => {
      const result = getBestTranslation(undefined as unknown as ProjectTranslation[], "en");

      expect(result).toBeUndefined();
    });

    // Edge cases
    it("handles case when both en and ru exist and en is requested", () => {
      const translations = [
        createMockTranslation("ru", { title: "Russian Title" }),
        createMockTranslation("en", { title: "English Title" }),
      ];

      const result = getBestTranslation(translations, "en");

      expect(result?.title).toBe("English Title");
    });

    it("handles case when only en exists and ru is requested", () => {
      const translations = [createMockTranslation("en")];

      const result = getBestTranslation(translations, "ru");

      expect(result).toBeDefined();
      expect(result?.language).toBe("en"); // Falls back to first available
    });
  });

  describe("resolveProjectTranslation", () => {
    // TC-TRANS-005: Merges translation with project
    it("merges translation fields into project when translation exists", () => {
      const translations = [
        createMockTranslation("en", {
          title: "English Title",
          shortDescription: "English Description",
          pitch: "English Pitch",
          traction: "English Traction",
          investmentDetails: "English Investment",
        }),
      ];

      const project = createMockProjectWithTranslations(translations, {
        title: "Legacy Title",
        shortDescription: "Legacy Description",
      });

      const result = resolveProjectTranslation(project, "en");

      expect(result.title).toBe("English Title");
      expect(result.shortDescription).toBe("English Description");
      expect(result.pitch).toBe("English Pitch");
      expect(result.traction).toBe("English Traction");
      expect(result.investmentDetails).toBe("English Investment");
      expect(result.language).toBe("en");
    });

    it("preserves non-translatable fields from project", () => {
      const translations = [createMockTranslation("en")];

      const project = createMockProjectWithTranslations(translations, {
        id: "project-123",
        slug: "my-project",
        websiteUrl: "https://example.com",
        status: "MVP",
        tags: ["ai", "saas"],
        likesCount: 42,
      });

      const result = resolveProjectTranslation(project, "en");

      expect(result.id).toBe("project-123");
      expect(result.slug).toBe("my-project");
      expect(result.websiteUrl).toBe("https://example.com");
      expect(result.status).toBe("MVP");
      expect(result.tags).toEqual(["ai", "saas"]);
      expect(result.likesCount).toBe(42);
    });

    it("includes translations array in result", () => {
      const translations = [
        createMockTranslation("en"),
        createMockTranslation("ru"),
      ];

      const project = createMockProjectWithTranslations(translations);

      const result = resolveProjectTranslation(project, "en");

      expect(result.translations).toHaveLength(2);
    });

    // TC-TRANS-006: Falls back to legacy fields when no translations
    it("falls back to project legacy fields when no translations exist", () => {
      const project = createMockProjectWithTranslations([], {
        title: "Legacy Title",
        shortDescription: "Legacy Description",
        pitch: "Legacy Pitch",
        traction: "Legacy Traction",
        investmentDetails: "Legacy Investment",
        language: "ru",
      });

      const result = resolveProjectTranslation(project, "en");

      expect(result.title).toBe("Legacy Title");
      expect(result.shortDescription).toBe("Legacy Description");
      expect(result.pitch).toBe("Legacy Pitch");
      expect(result.traction).toBe("Legacy Traction");
      expect(result.investmentDetails).toBe("Legacy Investment");
      expect(result.language).toBe("ru");
    });

    it("handles null legacy fields gracefully", () => {
      const project = createMockProjectWithTranslations([], {
        title: null as unknown as string,
        shortDescription: null as unknown as string,
        pitch: null as unknown as string,
      });

      const result = resolveProjectTranslation(project, "en");

      expect(result.title).toBe("");
      expect(result.shortDescription).toBe("");
      expect(result.pitch).toBe("");
    });

    it("uses default locale (Russian) when no locale specified", () => {
      const translations = [
        createMockTranslation("ru", { title: "Russian Title" }),
        createMockTranslation("en", { title: "English Title" }),
      ];

      const project = createMockProjectWithTranslations(translations);

      const result = resolveProjectTranslation(project);

      expect(result.title).toBe("Russian Title");
      expect(result.language).toBe("ru");
    });

    it("handles translation with null optional fields - falls back to legacy", () => {
      // When translation has null optional fields, the ?? operator falls back to legacy fields
      const translations = [
        createMockTranslation("en", {
          title: "Title",
          shortDescription: "Desc",
          pitch: "Pitch",
          traction: null,
          investmentDetails: null,
        }),
      ];

      const project = createMockProjectWithTranslations(translations, {
        traction: "Legacy Traction",
        investmentDetails: "Legacy Investment",
      });

      const result = resolveProjectTranslation(project, "en");

      // Note: ?? operator coalesces null, so falls back to legacy values
      expect(result.traction).toBe("Legacy Traction");
      expect(result.investmentDetails).toBe("Legacy Investment");
    });

    it("returns null for optional fields when both translation and legacy are null", () => {
      const translations = [
        createMockTranslation("en", {
          title: "Title",
          shortDescription: "Desc",
          pitch: "Pitch",
          traction: null,
          investmentDetails: null,
        }),
      ];

      const project = createMockProjectWithTranslations(translations, {
        traction: null,
        investmentDetails: null,
      });

      const result = resolveProjectTranslation(project, "en");

      expect(result.traction).toBeNull();
      expect(result.investmentDetails).toBeNull();
    });
  });

  describe("getAvailableLanguages", () => {
    // TC-TRANS-007: Returns supported languages only
    it("returns available languages from translations", () => {
      const translations = [
        createMockTranslation("en"),
        createMockTranslation("ru"),
      ];

      const result = getAvailableLanguages(translations);

      expect(result).toContain("en");
      expect(result).toContain("ru");
      expect(result).toHaveLength(2);
    });

    it("returns single language when only one translation exists", () => {
      const translations = [createMockTranslation("ru")];

      const result = getAvailableLanguages(translations);

      expect(result).toEqual(["ru"]);
    });

    it("returns empty array when no translations exist", () => {
      const result = getAvailableLanguages([]);

      expect(result).toEqual([]);
    });

    // TC-TRANS-008: Filters out unsupported languages
    it("filters out unsupported languages", () => {
      const translations = [
        createMockTranslation("en"),
        createMockTranslation("ru"),
        createMockTranslation("fr"), // unsupported
        createMockTranslation("de"), // unsupported
      ];

      const result = getAvailableLanguages(translations);

      expect(result).toContain("en");
      expect(result).toContain("ru");
      expect(result).not.toContain("fr");
      expect(result).not.toContain("de");
      expect(result).toHaveLength(2);
    });

    it("handles translations with only unsupported languages", () => {
      const translations = [
        createMockTranslation("fr"),
        createMockTranslation("de"),
      ];

      const result = getAvailableLanguages(translations);

      expect(result).toEqual([]);
    });
  });

  describe("Translation Resolution Scenarios", () => {
    // Scenario 1: User locale is "en" and only "ru" translation exists -> should return "ru"
    it("returns ru translation when user locale is en but only ru exists", () => {
      const translations = [
        createMockTranslation("ru", { title: "Russian Content" }),
      ];

      const project = createMockProjectWithTranslations(translations);
      const result = resolveProjectTranslation(project, "en");

      expect(result.title).toBe("Russian Content");
      expect(result.language).toBe("ru");
    });

    // Scenario 2: User locale is "ru" and both exist -> should return "ru"
    it("returns ru translation when user locale is ru and both translations exist", () => {
      const translations = [
        createMockTranslation("en", { title: "English Content" }),
        createMockTranslation("ru", { title: "Russian Content" }),
      ];

      const project = createMockProjectWithTranslations(translations);
      const result = resolveProjectTranslation(project, "ru");

      expect(result.title).toBe("Russian Content");
      expect(result.language).toBe("ru");
    });

    // Scenario 3: User locale is "en" and both exist -> should return "en"
    it("returns en translation when user locale is en and both translations exist", () => {
      const translations = [
        createMockTranslation("en", { title: "English Content" }),
        createMockTranslation("ru", { title: "Russian Content" }),
      ];

      const project = createMockProjectWithTranslations(translations);
      const result = resolveProjectTranslation(project, "en");

      expect(result.title).toBe("English Content");
      expect(result.language).toBe("en");
    });

    // Scenario 4: No translations exist -> should fallback to legacy fields
    it("falls back to legacy fields when no translations exist", () => {
      const project = createMockProjectWithTranslations([], {
        title: "Legacy Title",
        shortDescription: "Legacy Description",
        pitch: "Legacy Pitch",
        language: "ru",
      });

      const result = resolveProjectTranslation(project, "en");

      expect(result.title).toBe("Legacy Title");
      expect(result.shortDescription).toBe("Legacy Description");
      expect(result.pitch).toBe("Legacy Pitch");
      expect(result.language).toBe("ru");
    });
  });
});
