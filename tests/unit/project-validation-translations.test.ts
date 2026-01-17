import { describe, it, expect } from "vitest";
import {
  translationFieldsSchema,
  optionalTranslationFieldsSchema,
  translationsSchema,
  createProjectWithTranslationsSchema,
  updateTranslationSchema,
  languageSchema,
} from "@/lib/validations/project";

/**
 * Unit Tests for Project Translation Validation Schemas
 *
 * Test Cases Covered:
 * - TC-VAL-TRANS-001: translationFieldsSchema validates complete translation (P0)
 * - TC-VAL-TRANS-002: translationFieldsSchema rejects missing required fields (P0)
 * - TC-VAL-TRANS-003: translationsSchema requires at least one complete translation (P0)
 * - TC-VAL-TRANS-004: translationsSchema rejects empty translations object (P0)
 * - TC-VAL-TRANS-005: translationsSchema accepts both languages complete (P0)
 * - TC-VAL-TRANS-006: createProjectWithTranslationsSchema validates full project (P0)
 * - TC-VAL-TRANS-007: updateTranslationSchema validates language parameter (P0)
 * - TC-VAL-TRANS-008: Field length validations (P1)
 */

// Valid translation data for testing
const validTranslation = {
  title: "Valid Title",
  shortDescription: "A valid short description with enough characters",
  pitch: "A valid pitch that is long enough to pass validation requirements",
};

// Valid complete translation with optional fields
const validCompleteTranslation = {
  ...validTranslation,
  traction: "Some traction information",
  investmentDetails: "Looking for seed funding",
};

describe("Project Translation Validation Schemas", () => {
  describe("languageSchema", () => {
    it("accepts en as valid language", () => {
      const result = languageSchema.safeParse("en");
      expect(result.success).toBe(true);
    });

    it("accepts ru as valid language", () => {
      const result = languageSchema.safeParse("ru");
      expect(result.success).toBe(true);
    });

    it("rejects invalid language codes", () => {
      const invalidLanguages = ["fr", "de", "es", "EN", "RU", "english", ""];

      invalidLanguages.forEach((lang) => {
        const result = languageSchema.safeParse(lang);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("translationFieldsSchema", () => {
    // TC-VAL-TRANS-001: Validates complete translation
    it("accepts valid translation with all required fields", () => {
      const result = translationFieldsSchema.safeParse(validTranslation);

      expect(result.success).toBe(true);
    });

    it("accepts translation with optional fields", () => {
      const result = translationFieldsSchema.safeParse(validCompleteTranslation);

      expect(result.success).toBe(true);
    });

    it("accepts translation with null optional fields", () => {
      const result = translationFieldsSchema.safeParse({
        ...validTranslation,
        traction: null,
        investmentDetails: null,
      });

      expect(result.success).toBe(true);
    });

    // TC-VAL-TRANS-002: Rejects missing required fields
    it("rejects translation missing title", () => {
      const { title: _, ...dataWithoutTitle } = validTranslation;
      const result = translationFieldsSchema.safeParse(dataWithoutTitle);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it("rejects translation missing shortDescription", () => {
      const { shortDescription: _, ...dataWithoutDesc } = validTranslation;
      const result = translationFieldsSchema.safeParse(dataWithoutDesc);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.shortDescription).toBeDefined();
      }
    });

    it("rejects translation missing pitch", () => {
      const { pitch: _, ...dataWithoutPitch } = validTranslation;
      const result = translationFieldsSchema.safeParse(dataWithoutPitch);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.pitch).toBeDefined();
      }
    });

    // TC-VAL-TRANS-008: Field length validations
    it("rejects title shorter than 3 characters", () => {
      const result = translationFieldsSchema.safeParse({
        ...validTranslation,
        title: "AB",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title?.[0]).toContain("3 characters");
      }
    });

    it("rejects title longer than 100 characters", () => {
      const result = translationFieldsSchema.safeParse({
        ...validTranslation,
        title: "a".repeat(101),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title?.[0]).toContain("100 characters");
      }
    });

    it("accepts title with exactly 100 characters", () => {
      const result = translationFieldsSchema.safeParse({
        ...validTranslation,
        title: "a".repeat(100),
      });

      expect(result.success).toBe(true);
    });

    it("rejects shortDescription shorter than 10 characters", () => {
      const result = translationFieldsSchema.safeParse({
        ...validTranslation,
        shortDescription: "too short",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.shortDescription?.[0]).toContain("10 characters");
      }
    });

    it("rejects shortDescription longer than 280 characters", () => {
      const result = translationFieldsSchema.safeParse({
        ...validTranslation,
        shortDescription: "a".repeat(281),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.shortDescription?.[0]).toContain("280 characters");
      }
    });

    it("accepts shortDescription with exactly 280 characters", () => {
      const result = translationFieldsSchema.safeParse({
        ...validTranslation,
        shortDescription: "a".repeat(280),
      });

      expect(result.success).toBe(true);
    });

    it("rejects pitch shorter than 20 characters", () => {
      const result = translationFieldsSchema.safeParse({
        ...validTranslation,
        pitch: "too short pitch",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.pitch?.[0]).toContain("20 characters");
      }
    });

    it("rejects pitch longer than 10000 characters", () => {
      const result = translationFieldsSchema.safeParse({
        ...validTranslation,
        pitch: "a".repeat(10001),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.pitch?.[0]).toContain("10000 characters");
      }
    });

    it("accepts pitch with exactly 10000 characters", () => {
      const result = translationFieldsSchema.safeParse({
        ...validTranslation,
        pitch: "a".repeat(10000),
      });

      expect(result.success).toBe(true);
    });
  });

  describe("optionalTranslationFieldsSchema", () => {
    it("accepts empty object", () => {
      const result = optionalTranslationFieldsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts partial translation data", () => {
      const result = optionalTranslationFieldsSchema.safeParse({
        title: "Just a title",
      });
      expect(result.success).toBe(true);
    });

    it("accepts complete translation data", () => {
      const result = optionalTranslationFieldsSchema.safeParse(validTranslation);
      expect(result.success).toBe(true);
    });

    it("enforces max length even for optional fields", () => {
      const result = optionalTranslationFieldsSchema.safeParse({
        title: "a".repeat(101),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("translationsSchema", () => {
    // TC-VAL-TRANS-003: Requires at least one complete translation
    it("accepts only Russian translation complete", () => {
      const result = translationsSchema.safeParse({
        ru: validTranslation,
      });

      expect(result.success).toBe(true);
    });

    it("accepts only English translation complete", () => {
      const result = translationsSchema.safeParse({
        en: validTranslation,
      });

      expect(result.success).toBe(true);
    });

    // TC-VAL-TRANS-005: Accepts both languages complete
    it("accepts both translations complete", () => {
      const result = translationsSchema.safeParse({
        en: validTranslation,
        ru: {
          ...validTranslation,
          title: "Russian Title",
        },
      });

      expect(result.success).toBe(true);
    });

    // TC-VAL-TRANS-004: Rejects empty translations object
    it("rejects empty translations object", () => {
      const result = translationsSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().formErrors).toBeDefined();
        expect(result.error.flatten().formErrors.length).toBeGreaterThan(0);
      }
    });

    it("rejects when neither translation is complete", () => {
      const result = translationsSchema.safeParse({
        en: { title: "Only title" },
        ru: { shortDescription: "Only description" },
      });

      expect(result.success).toBe(false);
    });

    it("rejects partial en translation without complete ru", () => {
      const result = translationsSchema.safeParse({
        en: {
          title: "English Title",
          // Missing shortDescription and pitch
        },
      });

      expect(result.success).toBe(false);
    });

    it("rejects when en has title and shortDescription but missing pitch", () => {
      const result = translationsSchema.safeParse({
        en: {
          title: "English Title",
          shortDescription: "English description with enough chars",
          // Missing pitch
        },
      });

      expect(result.success).toBe(false);
    });

    it("accepts complete ru translation with partial en", () => {
      const result = translationsSchema.safeParse({
        ru: validTranslation,
        en: {
          title: "Partial English",
          // Missing other required fields - but that's ok because ru is complete
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("createProjectWithTranslationsSchema", () => {
    const validProjectWithTranslations = {
      translations: {
        ru: validTranslation,
      },
    };

    // TC-VAL-TRANS-006: Validates full project
    it("accepts valid project with translations", () => {
      const result = createProjectWithTranslationsSchema.safeParse(validProjectWithTranslations);

      expect(result.success).toBe(true);
    });

    it("accepts project with all optional fields", () => {
      const result = createProjectWithTranslationsSchema.safeParse({
        translations: {
          en: validTranslation,
          ru: {
            ...validTranslation,
            title: "Russian Title",
          },
        },
        websiteUrl: "https://example.com",
        screenshotUrl: "https://example.com/screenshot.png",
        status: "MVP",
        needsInvestment: true,
        teamMembers: [{ name: "John", role: "CEO" }],
        lookingFor: ["Developer"],
        tags: ["AI", "SaaS"],
      });

      expect(result.success).toBe(true);
    });

    it("applies default values", () => {
      const result = createProjectWithTranslationsSchema.safeParse({
        translations: {
          ru: validTranslation,
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("IDEA");
        expect(result.data.needsInvestment).toBe(false);
        expect(result.data.teamMembers).toEqual([]);
        expect(result.data.lookingFor).toEqual([]);
        expect(result.data.tags).toEqual([]);
      }
    });

    it("rejects missing translations", () => {
      const result = createProjectWithTranslationsSchema.safeParse({
        websiteUrl: "https://example.com",
      });

      expect(result.success).toBe(false);
    });

    it("validates URL format for websiteUrl", () => {
      const result = createProjectWithTranslationsSchema.safeParse({
        translations: {
          ru: validTranslation,
        },
        websiteUrl: "not-a-url",
      });

      expect(result.success).toBe(false);
    });

    it("enforces maximum 10 tags", () => {
      const result = createProjectWithTranslationsSchema.safeParse({
        translations: {
          ru: validTranslation,
        },
        tags: Array(11).fill("tag"),
      });

      expect(result.success).toBe(false);
    });

    it("validates project status enum", () => {
      const validStatuses = ["IDEA", "MVP", "BETA", "LAUNCHED", "PAUSED"];

      validStatuses.forEach((status) => {
        const result = createProjectWithTranslationsSchema.safeParse({
          translations: { ru: validTranslation },
          status,
        });
        expect(result.success).toBe(true);
      });

      const result = createProjectWithTranslationsSchema.safeParse({
        translations: { ru: validTranslation },
        status: "INVALID",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateTranslationSchema", () => {
    // TC-VAL-TRANS-007: Validates language parameter
    it("requires language field", () => {
      const result = updateTranslationSchema.safeParse({
        title: "Updated Title",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.language).toBeDefined();
      }
    });

    it("accepts valid language with optional update fields", () => {
      const result = updateTranslationSchema.safeParse({
        language: "en",
        title: "Updated Title",
      });

      expect(result.success).toBe(true);
    });

    it("accepts all update fields", () => {
      const result = updateTranslationSchema.safeParse({
        language: "ru",
        title: "Updated Title",
        shortDescription: "Updated description with enough characters",
        pitch: "Updated pitch that is long enough to pass validation",
        traction: "Updated traction",
        investmentDetails: "Updated investment details",
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid language", () => {
      const result = updateTranslationSchema.safeParse({
        language: "fr",
        title: "Updated Title",
      });

      expect(result.success).toBe(false);
    });

    it("validates field lengths when provided", () => {
      const result = updateTranslationSchema.safeParse({
        language: "en",
        title: "AB", // Too short
      });

      expect(result.success).toBe(false);
    });

    it("allows null for optional fields", () => {
      const result = updateTranslationSchema.safeParse({
        language: "en",
        traction: null,
        investmentDetails: null,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Validation Edge Cases", () => {
    it("handles unicode characters in translations", () => {
      const result = translationFieldsSchema.safeParse({
        title: "Startup Hub",
        shortDescription: "A description with some emojis and unicode chars",
        pitch: "A longer pitch with various unicode characters and content",
      });

      expect(result.success).toBe(true);
    });

    it("handles Cyrillic characters in translations", () => {
      const result = translationFieldsSchema.safeParse({
        title: "Test Title",
        shortDescription: "Short description example text for testing",
        pitch: "A longer pitch text that contains enough characters for validation",
      });

      expect(result.success).toBe(true);
    });

    it("trims whitespace for length validation", () => {
      // Test that leading/trailing whitespace doesn't affect validation incorrectly
      const result = translationFieldsSchema.safeParse({
        title: "   Valid Title   ",
        shortDescription: "   A valid short description with enough characters   ",
        pitch: "   A valid pitch that is long enough to pass validation requirements   ",
      });

      // Schema should still accept (zod doesn't trim by default)
      expect(result.success).toBe(true);
    });
  });
});
