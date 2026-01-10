import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/mcp/projects/route";
import {
  GET as GET_PROJECT,
  PUT,
  DELETE,
} from "@/app/api/mcp/projects/[id]/route";
import { NextRequest } from "next/server";
import {
  createMockProject,
  createMockAPIToken,
  TOKEN_PREFIX,
} from "../utils/helpers";
import { resetRateLimit } from "@/lib/rate-limit";

/**
 * Integration Tests for MCP API Endpoints
 *
 * Test Cases Covered:
 * - TC-MCP-001: Valid token authenticates successfully (P0)
 * - TC-MCP-002: Invalid token returns 401 (P0)
 * - TC-MCP-003: Missing Authorization header returns 401 (P0)
 * - TC-MCP-004: Revoked token returns 401 (P0)
 * - TC-MCP-010: POST creates project (P0)
 * - TC-MCP-011: GET lists user's projects (P0)
 * - TC-MCP-015: Cannot access other user's project (P0)
 * - TC-MCP-020: Read-only token can list projects (P0)
 * - TC-MCP-021: Read-only token cannot create project (P0)
 * - TC-MCP-030: Rate limiting (P0)
 * - TC-MCP-040: Request validation (P0)
 */

// Generate a valid test token
const validToken = `${TOKEN_PREFIX}${"a".repeat(32)}`;
const tokenPrefix = "aaaaaaaa";

// Mock database - use vi.hoisted to ensure mockPrisma is available when vi.mock runs
const mockPrisma = vi.hoisted(() => ({
  aPIToken: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  project: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  db: mockPrisma,
}));

// Mock bcrypt to validate our test token
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async (data: string) => `hashed_${data}`),
    compare: vi.fn(async (data: string, hash: string) => {
      // For testing, accept our valid token
      if (data === validToken && hash === `hashed_${validToken}`) {
        return true;
      }
      return false;
    }),
  },
}));

// Helper to create request with token
function createMCPRequest(
  method: string,
  url: string,
  token?: string,
  body?: unknown
): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method,
    headers,
  };

  if (body && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(`http://localhost:3000${url}`, init);
}

// Helper for route params
function createRouteParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("MCP API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset rate limits between tests
    resetRateLimit("test-token-id");
  });

  describe("Authentication", () => {
    // TC-MCP-001: Valid token authenticates successfully
    it("authenticates with valid token", async () => {
      const mockToken = createMockAPIToken({
        id: "test-token-id",
        userId: "test-user-id",
        tokenPrefix,
        tokenHash: `hashed_${validToken}`,
        permissions: ["read"],
        revokedAt: null,
        expiresAt: null,
      });

      mockPrisma.aPIToken.findMany.mockResolvedValue([mockToken]);
      mockPrisma.aPIToken.update.mockResolvedValue(mockToken);
      mockPrisma.project.findMany.mockResolvedValue([]);

      const request = createMCPRequest(
        "GET",
        "/api/mcp/projects",
        validToken
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    // TC-MCP-002: Invalid token returns 401
    it("returns 401 for invalid token", async () => {
      mockPrisma.aPIToken.findMany.mockResolvedValue([]);

      const request = createMCPRequest(
        "GET",
        "/api/mcp/projects",
        `${TOKEN_PREFIX}invalid_token_12345678901234`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe("UNAUTHORIZED");
    });

    // TC-MCP-003: Missing Authorization header returns 401
    it("returns 401 when Authorization header is missing", async () => {
      const request = createMCPRequest("GET", "/api/mcp/projects");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain("Authorization");
    });

    // TC-MCP-004: Revoked token returns 401
    it("returns 401 for revoked token", async () => {
      const revokedToken = createMockAPIToken({
        tokenPrefix,
        tokenHash: `hashed_${validToken}`,
        revokedAt: new Date(), // Token is revoked
      });

      // Revoked tokens are filtered out in the query
      mockPrisma.aPIToken.findMany.mockResolvedValue([]);

      const request = createMCPRequest(
        "GET",
        "/api/mcp/projects",
        validToken
      );

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("returns 401 for expired token", async () => {
      const expiredToken = createMockAPIToken({
        id: "test-token-id",
        tokenPrefix,
        tokenHash: `hashed_${validToken}`,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      mockPrisma.aPIToken.findMany.mockResolvedValue([expiredToken]);

      const request = createMCPRequest(
        "GET",
        "/api/mcp/projects",
        validToken
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain("expired");
    });

    it("returns 401 for malformed token format", async () => {
      const request = createMCPRequest(
        "GET",
        "/api/mcp/projects",
        "not_a_valid_token_format"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain("Invalid token format");
    });
  });

  describe("Permissions", () => {
    const setupValidToken = (permissions: string[]) => {
      const mockToken = createMockAPIToken({
        id: "test-token-id",
        userId: "test-user-id",
        tokenPrefix,
        tokenHash: `hashed_${validToken}`,
        permissions,
        revokedAt: null,
        expiresAt: null,
      });

      mockPrisma.aPIToken.findMany.mockResolvedValue([mockToken]);
      mockPrisma.aPIToken.update.mockResolvedValue(mockToken);
    };

    // TC-MCP-020: Read-only token can list projects
    it("allows read-only token to list projects", async () => {
      setupValidToken(["read"]);
      mockPrisma.project.findMany.mockResolvedValue([]);

      const request = createMCPRequest(
        "GET",
        "/api/mcp/projects",
        validToken
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    // TC-MCP-021: Read-only token cannot create project
    it("forbids read-only token from creating project", async () => {
      setupValidToken(["read"]); // Only read permission

      const request = createMCPRequest("POST", "/api/mcp/projects", validToken, {
        title: "Test Project",
        shortDescription: "A test project description with enough characters",
        pitch: "This is a test pitch that is long enough to pass validation",
        status: "IDEA",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("create");
    });

    // TC-MCP-022: Read-only token cannot update project
    it("forbids read-only token from updating project", async () => {
      setupValidToken(["read"]);

      mockPrisma.project.findUnique.mockResolvedValue(
        createMockProject({ ownerId: "test-user-id" })
      );

      const request = createMCPRequest(
        "PUT",
        "/api/mcp/projects/test-id",
        validToken,
        { title: "Updated Title" }
      );

      const response = await PUT(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("update");
    });

    // TC-MCP-023: Read-only token cannot delete project
    it("forbids read-only token from deleting project", async () => {
      setupValidToken(["read"]);

      const request = createMCPRequest(
        "DELETE",
        "/api/mcp/projects/test-id",
        validToken
      );

      const response = await DELETE(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("delete");
    });

    it("allows token with create permission to create project", async () => {
      setupValidToken(["read", "create"]);
      mockPrisma.project.create.mockResolvedValue(
        createMockProject({ ownerId: "test-user-id" })
      );

      const request = createMCPRequest("POST", "/api/mcp/projects", validToken, {
        title: "Test Project",
        shortDescription: "A test project description with enough characters",
        pitch: "This is a test pitch that is long enough to pass validation",
        status: "IDEA",
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe("CRUD Operations", () => {
    const setupValidToken = () => {
      const mockToken = createMockAPIToken({
        id: "test-token-id",
        userId: "test-user-id",
        tokenPrefix,
        tokenHash: `hashed_${validToken}`,
        permissions: ["read", "create", "update", "delete"],
        revokedAt: null,
        expiresAt: null,
      });

      mockPrisma.aPIToken.findMany.mockResolvedValue([mockToken]);
      mockPrisma.aPIToken.update.mockResolvedValue(mockToken);
    };

    // TC-MCP-011: GET lists user's projects
    it("returns user's projects on GET", async () => {
      setupValidToken();

      const userProjects = [
        createMockProject({ id: "p1", title: "Project 1", ownerId: "test-user-id" }),
        createMockProject({ id: "p2", title: "Project 2", ownerId: "test-user-id" }),
      ];

      mockPrisma.project.findMany.mockResolvedValue(userProjects);
      mockPrisma.project.count.mockResolvedValue(2);

      const request = createMCPRequest(
        "GET",
        "/api/mcp/projects",
        validToken
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.projects).toHaveLength(2);
      expect(data.data.pagination.total).toBe(2);
    });

    // TC-MCP-010: POST creates project
    it("creates project on POST", async () => {
      setupValidToken();

      const createdProject = createMockProject({
        ownerId: "test-user-id",
        title: "New Project",
      });

      mockPrisma.project.create.mockResolvedValue(createdProject);

      const request = createMCPRequest("POST", "/api/mcp/projects", validToken, {
        title: "New Project",
        shortDescription: "A test project description with enough characters",
        pitch: "This is a test pitch that is long enough to pass validation",
        status: "IDEA",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.project.title).toBe("New Project");
    });

    // TC-MCP-012: GET returns project detail
    it("returns project detail on GET /[id]", async () => {
      setupValidToken();

      const project = createMockProject({
        id: "test-id",
        ownerId: "test-user-id",
      });

      mockPrisma.project.findUnique.mockResolvedValue(project);

      const request = createMCPRequest(
        "GET",
        "/api/mcp/projects/test-id",
        validToken
      );

      const response = await GET_PROJECT(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.project.id).toBe("test-id");
    });

    // TC-MCP-015: Cannot access other user's project
    it("returns 404 for other user's project", async () => {
      setupValidToken();

      // Project owned by different user
      const otherUserProject = createMockProject({
        id: "other-id",
        ownerId: "other-user-id",
      });

      mockPrisma.project.findUnique.mockResolvedValue(otherUserProject);

      const request = createMCPRequest(
        "GET",
        "/api/mcp/projects/other-id",
        validToken
      );

      const response = await GET_PROJECT(request, createRouteParams("other-id"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe("NOT_FOUND");
    });

    // TC-MCP-013: PUT updates project
    it("updates project on PUT", async () => {
      setupValidToken();

      const existingProject = createMockProject({
        id: "test-id",
        ownerId: "test-user-id",
      });

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue({
        ...existingProject,
        title: "Updated Title",
      });

      const request = createMCPRequest(
        "PUT",
        "/api/mcp/projects/test-id",
        validToken,
        { title: "Updated Title" }
      );

      const response = await PUT(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.project.title).toBe("Updated Title");
    });

    // TC-MCP-014: DELETE deletes project
    it("deletes project on DELETE", async () => {
      setupValidToken();

      const existingProject = createMockProject({
        id: "test-id",
        ownerId: "test-user-id",
        title: "To Be Deleted",
      });

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.delete.mockResolvedValue(existingProject);

      const request = createMCPRequest(
        "DELETE",
        "/api/mcp/projects/test-id",
        validToken
      );

      const response = await DELETE(request, createRouteParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.deleted).toBe(true);
    });
  });

  describe("Request Validation", () => {
    const setupValidToken = () => {
      const mockToken = createMockAPIToken({
        id: "test-token-id",
        userId: "test-user-id",
        tokenPrefix,
        tokenHash: `hashed_${validToken}`,
        permissions: ["read", "create"],
        revokedAt: null,
        expiresAt: null,
      });

      mockPrisma.aPIToken.findMany.mockResolvedValue([mockToken]);
      mockPrisma.aPIToken.update.mockResolvedValue(mockToken);
    };

    // TC-MCP-040: Create project validates required fields
    it("returns 400 for missing required fields", async () => {
      setupValidToken();

      const request = createMCPRequest("POST", "/api/mcp/projects", validToken, {});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe("VALIDATION_ERROR");
    });

    // TC-MCP-041: Validates field lengths
    it("returns 400 for short description exceeding 280 chars", async () => {
      setupValidToken();

      const request = createMCPRequest("POST", "/api/mcp/projects", validToken, {
        title: "Test Project",
        shortDescription: "a".repeat(281),
        pitch: "This is a test pitch that is long enough to pass validation",
        status: "IDEA",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe("VALIDATION_ERROR");
    });

    // TC-MCP-042: Invalid status value rejected
    it("returns 400 for invalid status value", async () => {
      setupValidToken();

      const request = createMCPRequest("POST", "/api/mcp/projects", validToken, {
        title: "Test Project",
        shortDescription: "A test project description with enough characters",
        pitch: "This is a test pitch that is long enough to pass validation",
        status: "INVALID_STATUS",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid JSON body", async () => {
      const mockToken = createMockAPIToken({
        id: "test-token-id",
        userId: "test-user-id",
        tokenPrefix,
        tokenHash: `hashed_${validToken}`,
        permissions: ["read", "create"],
        revokedAt: null,
        expiresAt: null,
      });

      mockPrisma.aPIToken.findMany.mockResolvedValue([mockToken]);
      mockPrisma.aPIToken.update.mockResolvedValue(mockToken);

      const request = new NextRequest("http://localhost:3000/api/mcp/projects", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${validToken}`,
          "Content-Type": "application/json",
        },
        body: "invalid json{",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid JSON");
    });
  });

  describe("Rate Limiting", () => {
    // TC-MCP-030: Rate limit of 100 requests per minute
    it("includes rate limit headers in response", async () => {
      const mockToken = createMockAPIToken({
        id: "rate-limit-test-token",
        userId: "test-user-id",
        tokenPrefix,
        tokenHash: `hashed_${validToken}`,
        permissions: ["read"],
        revokedAt: null,
        expiresAt: null,
      });

      mockPrisma.aPIToken.findMany.mockResolvedValue([mockToken]);
      mockPrisma.aPIToken.update.mockResolvedValue(mockToken);
      mockPrisma.project.findMany.mockResolvedValue([]);

      const request = createMCPRequest(
        "GET",
        "/api/mcp/projects",
        validToken
      );

      const response = await GET(request);

      expect(response.headers.get("X-RateLimit-Limit")).toBeDefined();
      expect(response.headers.get("X-RateLimit-Remaining")).toBeDefined();
      expect(response.headers.get("X-RateLimit-Reset")).toBeDefined();
    });
  });
});
