import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockRequest,
  createMockSession,
  createMockProjectWithTranslations,
} from "../utils/helpers";

/**
 * Integration Tests for Project Visibility Feature
 *
 * Test Cases Covered:
 * - TC-VIS-001: Hidden project not shown in public list
 * - TC-VIS-002: Hidden project shown in owner's dashboard
 * - TC-VIS-003: Toggle visibility via API
 * - TC-VIS-004: Hidden project accessible by direct URL for owner only
 */

// Mock session
const mockSession = createMockSession();

// Mock modules before imports
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    like: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual<typeof import("@/lib/utils")>("@/lib/utils");
  return {
    ...actual,
    generateSlug: vi.fn((title: string) => `${title.toLowerCase().replace(/\s+/g, "-")}-abc123`),
  };
});

// Import after mocks are set up
import { GET as GET_PUBLIC } from "@/app/api/projects/public/route";
import { GET as GET_DASHBOARD, PUT } from "@/app/api/projects/[id]/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const mockDb = vi.mocked(db);
const mockAuth = vi.mocked(auth);

describe("Project Visibility Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe("GET /api/projects/public", () => {
    // TC-VIS-001: Hidden project not shown in public list
    it("excludes hidden projects from public list", async () => {
      const visibleProject = {
        ...createMockProjectWithTranslations(["en"], {
          id: "visible-1",
          ownerId: "other-user",
        }),
        // Override translation title to test
        translations: [{
          id: "trans-1",
          projectId: "visible-1",
          language: "en",
          title: "Visible Project",
          shortDescription: "A visible project description",
          pitch: "A visible project pitch that is long enough",
          features: null,
          traction: null,
          investmentDetails: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        owner: { id: "other-user", name: "Other", image: null },
      };

      // Only return visible projects
      mockDb.project.findMany.mockResolvedValue([visibleProject] as never);

      const request = createMockRequest("GET");
      const response = await GET_PUBLIC(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].title).toBe("Visible Project");

      // Verify the query included visible: true filter
      expect(mockDb.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visible: true,
          }),
        })
      );
    });

    it("does not include hidden projects even from current user in public list", async () => {
      // Public endpoint should always filter by visible: true
      mockDb.project.findMany.mockResolvedValue([]);

      const request = createMockRequest("GET");
      const response = await GET_PUBLIC(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockDb.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visible: true,
          }),
        })
      );
    });
  });

  describe("GET /api/projects (Dashboard)", () => {
    // TC-VIS-002: Hidden project shown in owner's dashboard
    it("includes hidden projects in owner's dashboard", async () => {
      const visibleProject = createMockProjectWithTranslations(["en"], {
        id: "visible-1",
        title: "Visible Project",
        ownerId: mockSession.user.id,
      });

      const hiddenProject = {
        ...createMockProjectWithTranslations(["en"], {
          id: "hidden-1",
          title: "Hidden Project",
          ownerId: mockSession.user.id,
        }),
        visible: false,
      };

      mockDb.project.findMany.mockResolvedValue([visibleProject, hiddenProject] as never);

      // Import dashboard GET (which shows all user's projects)
      const { GET: GET_DASHBOARD_PROJECTS } = await import("@/app/api/projects/route");
      
      const request = createMockRequest("GET");
      const response = await GET_DASHBOARD_PROJECTS(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toHaveLength(2);
      
      // Should not filter by visible for owner's dashboard
      expect(mockDb.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerId: mockSession.user.id,
          }),
        })
      );
      
      // Verify visible filter is NOT applied
      expect(mockDb.project.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visible: true,
          }),
        })
      );
    });
  });

  describe("PUT /api/projects/[id]", () => {
    // TC-VIS-003: Toggle visibility via API
    it("allows owner to set project as hidden", async () => {
      const existingProject = {
        ...createMockProjectWithTranslations(["en"], {
          id: "project-1",
          ownerId: mockSession.user.id,
        }),
        visible: true,
      };

      mockDb.project.findUnique.mockResolvedValue(existingProject as never);

      const updatedProject = {
        ...existingProject,
        visible: false,
      };
      mockDb.project.update.mockResolvedValue(updatedProject as never);

      const request = createMockRequest("PUT", {
        visible: false,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      // The response returns the updated project - check that update was called with visible: false
      expect(mockDb.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visible: false,
          }),
        })
      );
    });

    it("allows owner to set project as visible", async () => {
      const existingProject = {
        ...createMockProjectWithTranslations(["en"], {
          id: "project-1",
          ownerId: mockSession.user.id,
        }),
        visible: false,
      };

      mockDb.project.findUnique.mockResolvedValue(existingProject as never);

      const updatedProject = {
        ...existingProject,
        visible: true,
      };
      mockDb.project.update.mockResolvedValue(updatedProject as never);

      const request = createMockRequest("PUT", {
        visible: true,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      // The response returns the updated project - check that update was called with visible: true
      expect(mockDb.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visible: true,
          }),
        })
      );
    });

    it("prevents non-owner from changing visibility", async () => {
      const existingProject = {
        ...createMockProjectWithTranslations(["en"], {
          id: "project-1",
          ownerId: "other-user-id",
        }),
        visible: true,
      };

      mockDb.project.findUnique.mockResolvedValue(existingProject as never);

      const request = createMockRequest("PUT", {
        visible: false,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });
  });

  describe("GET /api/projects/[slug] (Public Project Page)", () => {
    // TC-VIS-004: Hidden project accessible by direct URL for owner only
    it("allows owner to access hidden project by slug", async () => {
      const hiddenProject = {
        ...createMockProjectWithTranslations(["en"], {
          id: "project-1",
          slug: "hidden-project",
          ownerId: mockSession.user.id,
        }),
        visible: false,
        owner: {
          id: mockSession.user.id,
          name: "Test User",
          email: "test@example.com",
          avatarUrl: null,
        },
      };

      mockDb.project.findFirst.mockResolvedValue(hiddenProject as never);

      // Import the public project page route
      const { GET: GET_PROJECT_BY_SLUG } = await import("@/app/api/projects/public/[slug]/route");
      
      const request = createMockRequest("GET");
      const response = await GET_PROJECT_BY_SLUG(request, {
        params: Promise.resolve({ slug: "hidden-project" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project).toBeDefined();
    });

    it("returns 404 for hidden project when accessed by non-owner", async () => {
      // Change session to different user
      mockAuth.mockResolvedValueOnce(createMockSession({
        id: "different-user",
        email: "different@example.com",
      }));

      const hiddenProject = {
        ...createMockProjectWithTranslations(["en"], {
          id: "project-1",
          slug: "hidden-project",
          ownerId: "original-owner",
        }),
        visible: false,
      };

      // First call returns the project (to check visibility)
      mockDb.project.findFirst.mockResolvedValueOnce(hiddenProject as never);

      const { GET: GET_PROJECT_BY_SLUG } = await import("@/app/api/projects/public/[slug]/route");
      
      const request = createMockRequest("GET");
      const response = await GET_PROJECT_BY_SLUG(request, {
        params: Promise.resolve({ slug: "hidden-project" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found");
    });

    it("returns 404 for hidden project when accessed by unauthenticated user", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const hiddenProject = {
        ...createMockProjectWithTranslations(["en"], {
          id: "project-1",
          slug: "hidden-project",
          ownerId: "some-owner",
        }),
        visible: false,
      };

      mockDb.project.findFirst.mockResolvedValueOnce(hiddenProject as never);

      const { GET: GET_PROJECT_BY_SLUG } = await import("@/app/api/projects/public/[slug]/route");
      
      const request = createMockRequest("GET");
      const response = await GET_PROJECT_BY_SLUG(request, {
        params: Promise.resolve({ slug: "hidden-project" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found");
    });

    it("returns visible project for any user", async () => {
      mockAuth.mockResolvedValueOnce(null); // Unauthenticated

      const visibleProject = {
        ...createMockProjectWithTranslations(["en"], {
          id: "project-1",
          slug: "visible-project",
          ownerId: "some-owner",
        }),
        visible: true,
        owner: {
          id: "some-owner",
          name: "Owner",
          email: "owner@example.com",
          avatarUrl: null,
        },
      };

      mockDb.project.findFirst.mockResolvedValue(visibleProject as never);

      const { GET: GET_PROJECT_BY_SLUG } = await import("@/app/api/projects/public/[slug]/route");
      
      const request = createMockRequest("GET");
      const response = await GET_PROJECT_BY_SLUG(request, {
        params: Promise.resolve({ slug: "visible-project" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project).toBeDefined();
    });
  });
});
