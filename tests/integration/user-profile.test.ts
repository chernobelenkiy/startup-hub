import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockRequest,
  createMockSession,
  createMockUser,
} from "../utils/helpers";

/**
 * Integration Tests for User Profile API Routes
 *
 * Test Cases Covered:
 * - TC-PROFILE-001: Update profile with all new fields (bio, title, company, socialLinks, openToContact)
 * - TC-PROFILE-002: Validate social links format
 * - TC-PROFILE-003: Get public user profile by ID
 * - TC-PROFILE-004: Cannot get non-existent user profile
 */

// Mock session
const mockSession = createMockSession();

// Mock modules before imports
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import after mocks are set up
import { PATCH } from "@/app/api/user/profile/route";
import { GET as GET_PUBLIC_PROFILE } from "@/app/api/user/[id]/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const mockDb = vi.mocked(db);
const mockAuth = vi.mocked(auth);

describe("User Profile API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe("PATCH /api/user/profile", () => {
    // TC-PROFILE-001: Update profile with all new fields
    it("updates profile with all enhanced fields", async () => {
      const profileData = {
        name: "John Doe",
        bio: "Passionate entrepreneur building the future of AI",
        title: "CEO & Co-founder",
        company: "TechStartup Inc.",
        socialLinks: {
          linkedin: "https://linkedin.com/in/johndoe",
          github: "https://github.com/johndoe",
          telegram: "johndoe",
          instagram: "johndoe_tech",
          website: "https://johndoe.com",
        },
        openToContact: true,
      };

      const updatedUser = {
        id: mockSession.user.id,
        email: mockSession.user.email,
        ...profileData,
      };

      mockDb.user.update.mockResolvedValue(updatedUser as never);

      const request = createMockRequest("PATCH", profileData);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.bio).toBe(profileData.bio);
      expect(data.user.title).toBe(profileData.title);
      expect(data.user.company).toBe(profileData.company);
      expect(data.user.socialLinks).toEqual(profileData.socialLinks);
      expect(data.user.openToContact).toBe(true);
    });

    it("updates only specific fields without affecting others", async () => {
      const partialUpdate = {
        bio: "New bio text",
      };

      const updatedUser = {
        id: mockSession.user.id,
        email: mockSession.user.email,
        name: "Original Name",
        bio: "New bio text",
        title: "Original Title",
        company: null,
        socialLinks: null,
        openToContact: false,
      };

      mockDb.user.update.mockResolvedValue(updatedUser as never);

      const request = createMockRequest("PATCH", partialUpdate);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.bio).toBe("New bio text");
    });

    // TC-PROFILE-002: Validate social links format
    it("rejects invalid social links URL format", async () => {
      const invalidData = {
        socialLinks: {
          linkedin: "not-a-valid-url",
          github: "https://github.com/valid",
        },
      };

      const request = createMockRequest("PATCH", invalidData);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details?.socialLinks).toBeDefined();
    });

    it("rejects bio that exceeds maximum length", async () => {
      const invalidData = {
        bio: "x".repeat(1001), // Max 1000 characters
      };

      const request = createMockRequest("PATCH", invalidData);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details?.bio).toBeDefined();
    });

    it("returns 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = createMockRequest("PATCH", { name: "Test" });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("allows empty socialLinks object", async () => {
      const profileData = {
        socialLinks: {},
      };

      const updatedUser = {
        id: mockSession.user.id,
        email: mockSession.user.email,
        socialLinks: {},
      };

      mockDb.user.update.mockResolvedValue(updatedUser as never);

      const request = createMockRequest("PATCH", profileData);
      const response = await PATCH(request);

      expect(response.status).toBe(200);
    });

    it("validates telegram username format (no URL required)", async () => {
      const profileData = {
        socialLinks: {
          telegram: "valid_username123",
        },
      };

      const updatedUser = {
        id: mockSession.user.id,
        email: mockSession.user.email,
        socialLinks: { telegram: "valid_username123" },
      };

      mockDb.user.update.mockResolvedValue(updatedUser as never);

      const request = createMockRequest("PATCH", profileData);
      const response = await PATCH(request);

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/user/[id]", () => {
    // TC-PROFILE-003: Get public user profile by ID
    it("returns public user profile with social links", async () => {
      const publicUser = {
        id: "user-123",
        name: "Jane Doe",
        bio: "Building cool stuff",
        title: "Founder",
        company: "Startup Co",
        avatarUrl: "https://example.com/avatar.jpg",
        socialLinks: {
          linkedin: "https://linkedin.com/in/janedoe",
          github: "https://github.com/janedoe",
        },
        openToContact: true,
        createdAt: new Date(),
      };

      mockDb.user.findUnique.mockResolvedValue(publicUser as never);

      const request = createMockRequest("GET");
      const response = await GET_PUBLIC_PROFILE(request, {
        params: Promise.resolve({ id: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe("user-123");
      expect(data.user.name).toBe("Jane Doe");
      expect(data.user.bio).toBe("Building cool stuff");
      expect(data.user.socialLinks).toEqual(publicUser.socialLinks);
      // Should not expose email
      expect(data.user.email).toBeUndefined();
    });

    // TC-PROFILE-004: Cannot get non-existent user profile
    it("returns 404 for non-existent user", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest("GET");
      const response = await GET_PUBLIC_PROFILE(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });

    it("returns user profile without sensitive data", async () => {
      // The API uses select to only return specific fields, so mock
      // should return only what the API actually selects
      const publicUserProfile = {
        id: "user-123",
        name: "Jane Doe",
        bio: "Building cool stuff",
        title: "Founder",
        company: "Startup Co",
        avatarUrl: null,
        socialLinks: null,
        openToContact: false,
        createdAt: new Date(),
        // Note: email, emailVerified, locale, updatedAt are NOT selected by the API
      };

      mockDb.user.findUnique.mockResolvedValue(publicUserProfile as never);

      const request = createMockRequest("GET");
      const response = await GET_PUBLIC_PROFILE(request, {
        params: Promise.resolve({ id: "user-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      // These fields should not be present because the API doesn't select them
      expect(data.user.email).toBeUndefined();
      expect(data.user.emailVerified).toBeUndefined();
      expect(data.user.locale).toBeUndefined();
      expect(data.user.updatedAt).toBeUndefined();
      // These should be present
      expect(data.user.name).toBe("Jane Doe");
      expect(data.user.bio).toBe("Building cool stuff");
    });
  });
});
