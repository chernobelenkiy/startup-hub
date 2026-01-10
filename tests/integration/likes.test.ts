import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSession, createMockProject } from "../utils/helpers";

/**
 * Integration Tests for Like API Routes
 *
 * Test Cases Covered:
 * - TC-LIKE-001: Authenticated user can like a project (P0)
 * - TC-LIKE-010: Authenticated user can unlike a project (P0)
 * - TC-LIKE-021: Unauthenticated user cannot like (P0)
 * - TC-LIKE-030: User cannot like same project twice (P0)
 */

// Mock session - will be overridden in tests
let mockSession: ReturnType<typeof createMockSession> | null = createMockSession();

// Mock modules before imports - vi.mock is hoisted
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Import after mocks are set up
import { POST, GET } from "@/app/api/projects/[id]/like/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const mockDb = vi.mocked(db);
const mockAuth = vi.mocked(auth);

// Helper to create route params
function createRouteParams(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("Like API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = createMockSession();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe("POST /api/projects/[id]/like", () => {
    // TC-LIKE-001: Authenticated user can like a project
    it("allows authenticated user to like a project", async () => {
      const project = createMockProject({ likesCount: 0 });

      mockDb.project.findUnique.mockResolvedValue(project as never);
      mockDb.like.findUnique.mockResolvedValue(null); // Not liked yet

      // Mock transaction for liking
      mockDb.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn({
          like: {
            create: vi.fn().mockResolvedValue({}),
          },
          project: {
            update: vi.fn().mockResolvedValue({ likesCount: 1 }),
          },
        });
      });

      const request = new NextRequest("http://localhost:3000/api/projects/test-id/like", {
        method: "POST",
      });

      const response = await POST(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.liked).toBe(true);
      expect(data.likesCount).toBe(1);
    });

    // TC-LIKE-010: Authenticated user can unlike a project
    it("allows authenticated user to unlike a project", async () => {
      const project = createMockProject({ likesCount: 1 });

      mockDb.project.findUnique.mockResolvedValue(project as never);
      mockDb.like.findUnique.mockResolvedValue({
        userId: mockSession!.user.id,
        projectId: "test-id",
      } as never); // Already liked

      // Mock transaction for unliking
      mockDb.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn({
          like: {
            delete: vi.fn().mockResolvedValue({}),
          },
          project: {
            update: vi.fn().mockResolvedValue({ likesCount: 0 }),
          },
        });
      });

      const request = new NextRequest("http://localhost:3000/api/projects/test-id/like", {
        method: "POST",
      });

      const response = await POST(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.liked).toBe(false);
      expect(data.likesCount).toBe(0);
    });

    // TC-LIKE-021: Unauthenticated user prompted to login on like attempt
    it("returns 401 for unauthenticated user", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = new NextRequest("http://localhost:3000/api/projects/test-id/like", {
        method: "POST",
      });

      const response = await POST(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when project does not exist", async () => {
      mockDb.project.findUnique.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/projects/nonexistent/like", {
        method: "POST",
      });

      const response = await POST(request, createRouteParams("nonexistent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Not Found");
    });

    // TC-LIKE-030: Duplicate prevention - unique constraint
    it("handles race condition with unique constraint violation", async () => {
      const project = createMockProject();

      mockDb.project.findUnique.mockResolvedValue(project as never);
      mockDb.like.findUnique.mockResolvedValue(null);

      // Simulate unique constraint violation
      mockDb.$transaction.mockRejectedValue(
        new Error("Unique constraint failed")
      );

      const request = new NextRequest("http://localhost:3000/api/projects/test-id/like", {
        method: "POST",
      });

      const response = await POST(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Conflict");
    });

    // TC-LIKE-011: Unlike prevents negative counts
    it("ensures like count does not go below zero", async () => {
      const project = createMockProject({ likesCount: 0 });

      mockDb.project.findUnique.mockResolvedValue(project as never);
      mockDb.like.findUnique.mockResolvedValue({
        userId: mockSession!.user.id,
        projectId: "test-id",
      } as never);

      // Transaction returns negative count (edge case)
      mockDb.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn({
          like: {
            delete: vi.fn().mockResolvedValue({}),
          },
          project: {
            update: vi.fn().mockResolvedValue({ likesCount: -1 }),
          },
        });
      });

      const request = new NextRequest("http://localhost:3000/api/projects/test-id/like", {
        method: "POST",
      });

      const response = await POST(request, createRouteParams("test-id"));
      const data = await response.json();

      // The API should return Math.max(0, count)
      expect(data.likesCount).toBe(0);
    });
  });

  describe("GET /api/projects/[id]/like", () => {
    // TC-LIKE-020: Unauthenticated user sees like count
    it("returns like count for unauthenticated user", async () => {
      mockAuth.mockResolvedValueOnce(null);

      mockDb.project.findUnique.mockResolvedValue({
        likesCount: 5,
        likes: false, // No user to check likes for
      } as never);

      const request = new NextRequest("http://localhost:3000/api/projects/test-id/like", {
        method: "GET",
      });

      const response = await GET(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.likesCount).toBe(5);
      expect(data.liked).toBe(false);
    });

    it("returns liked status for authenticated user who liked", async () => {
      mockDb.project.findUnique.mockResolvedValue({
        likesCount: 5,
        likes: [{ userId: mockSession!.user.id }],
      } as never);

      const request = new NextRequest("http://localhost:3000/api/projects/test-id/like", {
        method: "GET",
      });

      const response = await GET(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.liked).toBe(true);
      expect(data.likesCount).toBe(5);
    });

    it("returns liked=false for authenticated user who has not liked", async () => {
      mockDb.project.findUnique.mockResolvedValue({
        likesCount: 5,
        likes: [],
      } as never);

      const request = new NextRequest("http://localhost:3000/api/projects/test-id/like", {
        method: "GET",
      });

      const response = await GET(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.liked).toBe(false);
    });

    it("returns 404 when project does not exist", async () => {
      mockDb.project.findUnique.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/projects/nonexistent/like", {
        method: "GET",
      });

      const response = await GET(request, createRouteParams("nonexistent"));
      const data = await response.json();

      expect(response.status).toBe(404);
    });
  });
});
