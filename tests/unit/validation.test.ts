import { describe, it, expect } from "vitest";
import {
  signInSchema,
  registerSchema,
  apiTokenSchema,
} from "@/lib/validations/auth";
import {
  createProjectSchema,
  updateProjectSchema,
  projectStatusSchema,
} from "@/lib/validations/project";

/**
 * Unit Tests for Validation Schemas
 *
 * Test Cases Covered:
 * - TC-AUTH-004: Password min 8 characters
 * - TC-AUTH-005: Password must contain at least 1 number
 * - TC-AUTH-003: Invalid email format (P1 but included for coverage)
 * - TC-PROJ-004: Short description 280 char limit
 * - TC-PROJ-005: Pitch 500 char limit
 */

describe("Auth Validation Schemas", () => {
  describe("signInSchema", () => {
    it("accepts valid email and password", () => {
      const result = signInSchema.safeParse({
        email: "user@example.com",
        password: "Password1",
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid email format", () => {
      const invalidEmails = ["invalid", "@domain.com", "user@", "user@.com"];

      invalidEmails.forEach((email) => {
        const result = signInSchema.safeParse({
          email,
          password: "Password1",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.email).toBeDefined();
        }
      });
    });

    // TC-AUTH-004: Password must be at least 8 characters
    it("rejects password with less than 8 characters", () => {
      const shortPasswords = ["Pass1", "1234567", "Abcd12", ""];

      shortPasswords.forEach((password) => {
        const result = signInSchema.safeParse({
          email: "user@example.com",
          password,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.password).toBeDefined();
          expect(result.error.flatten().fieldErrors.password?.[0]).toContain(
            "8 characters"
          );
        }
      });
    });

    // TC-AUTH-005: Password must contain at least 1 number
    it("rejects password without numbers", () => {
      const passwordsWithoutNumbers = [
        "PasswordOnly",
        "NoNumbersHere",
        "abcdefghij",
      ];

      passwordsWithoutNumbers.forEach((password) => {
        const result = signInSchema.safeParse({
          email: "user@example.com",
          password,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.password).toBeDefined();
          expect(result.error.flatten().fieldErrors.password?.[0]).toContain(
            "1 number"
          );
        }
      });
    });

    it("accepts password with exactly 8 characters and 1 number", () => {
      const result = signInSchema.safeParse({
        email: "user@example.com",
        password: "Passwo1d", // 8 chars with 1 number
      });

      expect(result.success).toBe(true);
    });
  });

  describe("registerSchema", () => {
    it("accepts valid registration data with matching passwords", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      });

      expect(result.success).toBe(true);
    });

    it("rejects when passwords do not match", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "Password1",
        confirmPassword: "Password2",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.flatten().fieldErrors.confirmPassword
        ).toBeDefined();
        expect(
          result.error.flatten().fieldErrors.confirmPassword?.[0]
        ).toContain("match");
      }
    });

    it("validates email format", () => {
      const result = registerSchema.safeParse({
        email: "invalid-email",
        password: "Password1",
        confirmPassword: "Password1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it("validates password requirements", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "short",
        confirmPassword: "short",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toBeDefined();
      }
    });
  });

  describe("apiTokenSchema", () => {
    it("accepts valid token creation data", () => {
      const result = apiTokenSchema.safeParse({
        name: "My API Token",
        permissions: ["read", "create"],
      });

      expect(result.success).toBe(true);
    });

    it("requires token name", () => {
      const result = apiTokenSchema.safeParse({
        name: "",
        permissions: ["read"],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined();
      }
    });

    it("requires at least one permission", () => {
      const result = apiTokenSchema.safeParse({
        name: "Test Token",
        permissions: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.permissions).toBeDefined();
      }
    });

    it("rejects invalid permission types", () => {
      const result = apiTokenSchema.safeParse({
        name: "Test Token",
        permissions: ["read", "invalid"],
      });

      expect(result.success).toBe(false);
    });

    it("accepts all valid permission types", () => {
      const result = apiTokenSchema.safeParse({
        name: "Full Access Token",
        permissions: ["read", "create", "update", "delete"],
      });

      expect(result.success).toBe(true);
    });

    it("enforces max name length of 50 characters", () => {
      const result = apiTokenSchema.safeParse({
        name: "a".repeat(51),
        permissions: ["read"],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined();
      }
    });
  });
});

describe("Project Validation Schemas", () => {
  describe("projectStatusSchema", () => {
    it("accepts all valid project statuses", () => {
      const validStatuses = ["IDEA", "MVP", "BETA", "LAUNCHED", "PAUSED"];

      validStatuses.forEach((status) => {
        const result = projectStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid project status", () => {
      const result = projectStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("createProjectSchema", () => {
    const validProjectData = {
      title: "My Startup Project",
      shortDescription: "A brief but descriptive summary of the project",
      pitch:
        "This is a longer pitch that explains the project in more detail and why it matters",
      status: "IDEA" as const,
    };

    it("accepts valid project data with required fields only", () => {
      const result = createProjectSchema.safeParse(validProjectData);
      expect(result.success).toBe(true);
    });

    it("accepts project data with all optional fields", () => {
      const fullData = {
        ...validProjectData,
        websiteUrl: "https://example.com",
        screenshotUrl: "https://example.com/screenshot.png",
        estimatedLaunch: new Date("2025-06-01"),
        needsInvestment: true,
        investmentDetails: "Looking for seed funding",
        teamMembers: [{ name: "John Doe", role: "CEO" }],
        lookingFor: ["Developer", "Designer"],
        tags: ["AI", "SaaS"],
        language: "en" as const,
      };

      const result = createProjectSchema.safeParse(fullData);
      expect(result.success).toBe(true);
    });

    it("requires title", () => {
      const { title: _title, ...dataWithoutTitle } = validProjectData;
      const result = createProjectSchema.safeParse(dataWithoutTitle);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it("enforces title minimum length of 3 characters", () => {
      const result = createProjectSchema.safeParse({
        ...validProjectData,
        title: "AB",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title?.[0]).toContain(
          "3 characters"
        );
      }
    });

    it("enforces title maximum length of 100 characters", () => {
      const result = createProjectSchema.safeParse({
        ...validProjectData,
        title: "a".repeat(101),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title?.[0]).toContain(
          "100 characters"
        );
      }
    });

    // TC-PROJ-004: Short description 280 character limit
    it("enforces short description maximum of 280 characters", () => {
      const result = createProjectSchema.safeParse({
        ...validProjectData,
        shortDescription: "a".repeat(281),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.flatten().fieldErrors.shortDescription?.[0]
        ).toContain("280 characters");
      }
    });

    it("accepts short description with exactly 280 characters", () => {
      const result = createProjectSchema.safeParse({
        ...validProjectData,
        shortDescription: "a".repeat(280),
      });

      expect(result.success).toBe(true);
    });

    it("enforces short description minimum of 10 characters", () => {
      const result = createProjectSchema.safeParse({
        ...validProjectData,
        shortDescription: "too short",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.flatten().fieldErrors.shortDescription?.[0]
        ).toContain("10 characters");
      }
    });

    // TC-PROJ-005: Pitch 10000 character limit
    it("enforces pitch maximum of 10000 characters", () => {
      const result = createProjectSchema.safeParse({
        ...validProjectData,
        pitch: "a".repeat(10001),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.pitch?.[0]).toContain(
          "10000 characters"
        );
      }
    });

    it("accepts pitch with exactly 10000 characters", () => {
      const result = createProjectSchema.safeParse({
        ...validProjectData,
        pitch: "a".repeat(10000),
      });

      expect(result.success).toBe(true);
    });

    it("enforces pitch minimum of 20 characters", () => {
      const result = createProjectSchema.safeParse({
        ...validProjectData,
        pitch: "too short pitch",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.pitch?.[0]).toContain(
          "20 characters"
        );
      }
    });

    it("enforces maximum 10 tags", () => {
      const result = createProjectSchema.safeParse({
        ...validProjectData,
        tags: Array(11).fill("tag"),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.tags?.[0]).toContain(
          "10 tags"
        );
      }
    });

    it("validates website URL format", () => {
      const result = createProjectSchema.safeParse({
        ...validProjectData,
        websiteUrl: "not-a-url",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.websiteUrl).toBeDefined();
      }
    });

    it("only accepts en or ru for language", () => {
      const resultInvalid = createProjectSchema.safeParse({
        ...validProjectData,
        language: "fr",
      });

      expect(resultInvalid.success).toBe(false);

      const resultEn = createProjectSchema.safeParse({
        ...validProjectData,
        language: "en",
      });
      expect(resultEn.success).toBe(true);

      const resultRu = createProjectSchema.safeParse({
        ...validProjectData,
        language: "ru",
      });
      expect(resultRu.success).toBe(true);
    });
  });

  describe("updateProjectSchema", () => {
    it("allows partial updates", () => {
      const result = updateProjectSchema.safeParse({
        title: "Updated Title",
      });

      expect(result.success).toBe(true);
    });

    it("validates fields when provided", () => {
      const result = updateProjectSchema.safeParse({
        title: "AB", // Too short
      });

      expect(result.success).toBe(false);
    });

    it("accepts empty update (no fields)", () => {
      const result = updateProjectSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
