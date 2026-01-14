import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockRequest,
  createMockProject,
  createMockSession,
  createMockProjectWithTranslations,
} from "../utils/helpers";

/**
 * Integration Tests for Projects API Routes
 *
 * Test Cases Covered:
 * - TC-PROJ-001: Successfully create project (P0)
 * - TC-PROJ-003: Create project fails without title (P0)
 * - TC-PROJ-040: Dashboard shows only user's projects (P0)
 */

// Mock session
const mockSession = createMockSession();

// Mock modules before imports - vi.mock is hoisted
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findMany: vi.fn(),
      create: vi.fn(),
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
import { GET, POST } from "@/app/api/projects/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const mockDb = vi.mocked(db);
const mockAuth = vi.mocked(auth);

describe("Projects API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe("GET /api/projects", () => {
    // TC-PROJ-040: Dashboard shows only user's own projects
    it("returns only the authenticated user's projects", async () => {
      // Use createMockProjectWithTranslations since GET now includes translations
      const userProjects = [
        createMockProjectWithTranslations(["ru"], { id: "project-1", title: "Project 1", ownerId: mockSession.user.id }),
        createMockProjectWithTranslations(["ru"], { id: "project-2", title: "Project 2", ownerId: mockSession.user.id }),
      ];

      mockDb.project.findMany.mockResolvedValue(userProjects as never);

      // GET now requires a request object for Accept-Language header
      const request = createMockRequest("GET");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toHaveLength(2);
      expect(mockDb.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: mockSession.user.id },
          include: { translations: true },
        })
      );
    });

    it("returns 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = createMockRequest("GET");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns empty array when user has no projects", async () => {
      mockDb.project.findMany.mockResolvedValue([]);

      const request = createMockRequest("GET");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toHaveLength(0);
    });

    it("handles database errors gracefully", async () => {
      mockDb.project.findMany.mockRejectedValue(new Error("DB Error"));

      const request = createMockRequest("GET");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to fetch");
    });
  });

  describe("POST /api/projects", () => {
    const validProjectData = {
      title: "My New Startup",
      shortDescription: "A revolutionary new platform for startups and innovation",
      pitch: "This is a longer pitch that explains why this startup is going to change the world with innovation",
      status: "IDEA",
    };

    // TC-PROJ-001: Successfully create project with all required fields
    it("creates a project with valid data", async () => {
      // Include translations in mock since POST now creates with translations
      const createdProject = createMockProjectWithTranslations(["ru"], {
        ...validProjectData,
        slug: "my-new-startup-abc123",
        ownerId: mockSession.user.id,
      });

      mockDb.project.create.mockResolvedValue(createdProject as never);

      const request = createMockRequest("POST", validProjectData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.project).toBeDefined();
      expect(data.project.title).toBe(validProjectData.title);
    });

    // TC-PROJ-003: Create project fails without title
    it("returns 400 when title is missing", async () => {
      const { title: _title, ...dataWithoutTitle } = validProjectData;

      const request = createMockRequest("POST", dataWithoutTitle);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details?.title).toBeDefined();
    });

    it("returns 400 when short description is too short", async () => {
      const request = createMockRequest("POST", {
        ...validProjectData,
        shortDescription: "Too short",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details?.shortDescription).toBeDefined();
    });

    it("returns 400 when pitch is too short", async () => {
      const request = createMockRequest("POST", {
        ...validProjectData,
        pitch: "Too short pitch",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details?.pitch).toBeDefined();
    });

    it("returns 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = createMockRequest("POST", validProjectData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("generates slug from title", async () => {
      const createdProject = createMockProjectWithTranslations(["ru"], {
        ...validProjectData,
        slug: "my-new-startup-abc123",
      });

      mockDb.project.create.mockResolvedValue(createdProject as never);

      const request = createMockRequest("POST", validProjectData);
      await POST(request);

      expect(mockDb.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: expect.stringContaining("my-new-startup"),
          }),
        })
      );
    });

    it("creates project with optional fields", async () => {
      const fullProjectData = {
        ...validProjectData,
        websiteUrl: "https://example.com",
        tags: ["AI", "SaaS"],
        lookingFor: ["Developer"],
        needsInvestment: true,
        investmentDetails: "Looking for $100K seed",
      };

      const createdProject = createMockProjectWithTranslations(["ru"], fullProjectData);
      mockDb.project.create.mockResolvedValue(createdProject as never);

      const request = createMockRequest("POST", fullProjectData);
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockDb.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: ["AI", "SaaS"],
            lookingFor: ["Developer"],
            needsInvestment: true,
          }),
        })
      );
    });

    it("clears investment details when needsInvestment is false", async () => {
      const projectData = {
        ...validProjectData,
        needsInvestment: false,
        investmentDetails: "This should be cleared",
      };

      const createdProject = createMockProjectWithTranslations(["ru"], {
        ...projectData,
        investmentDetails: null,
      });

      mockDb.project.create.mockResolvedValue(createdProject as never);

      const request = createMockRequest("POST", projectData);
      await POST(request);

      expect(mockDb.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            investmentDetails: null,
          }),
        })
      );
    });

    it("handles database errors gracefully", async () => {
      mockDb.project.create.mockRejectedValue(new Error("DB Error"));

      const request = createMockRequest("POST", validProjectData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to create");
    });
  });
});
