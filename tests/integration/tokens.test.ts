import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/tokens/route";
import { createMockRequest, createMockSession, createMockAPIToken } from "../utils/helpers";

/**
 * Integration Tests for Token API Routes
 *
 * Test Cases Covered:
 * - TC-TOKEN-001: Successfully generate new API token (P0)
 * - TC-TOKEN-004: Cannot generate more than 10 tokens (P0)
 * - TC-TOKEN-010: Token table shows all user tokens (P0)
 * - TC-TOKEN-030: Token stored as bcrypt hash (P0)
 */

// Mock session - inline the mock session creation in vi.hoisted
const mockSession = vi.hoisted(() => ({
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

// Mock database - use vi.hoisted to ensure mockPrisma is available when vi.mock runs
const mockPrisma = vi.hoisted(() => ({
  aPIToken: {
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  db: mockPrisma,
}));

describe("Token API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/tokens", () => {
    // TC-TOKEN-010: Token table shows all user tokens
    it("returns all tokens for authenticated user", async () => {
      const userTokens = [
        createMockAPIToken({ id: "token-1", name: "Token 1" }),
        createMockAPIToken({ id: "token-2", name: "Token 2", revokedAt: new Date() }),
      ];

      mockPrisma.aPIToken.findMany.mockResolvedValue(userTokens);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tokens).toHaveLength(2);
      expect(data.tokens[0].name).toBe("Token 1");
      expect(data.tokens[0].status).toBe("active");
      expect(data.tokens[1].status).toBe("revoked");
    });

    it("returns 401 when user is not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValueOnce(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns empty array when user has no tokens", async () => {
      mockPrisma.aPIToken.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tokens).toHaveLength(0);
    });

    it("does not expose token hash in response", async () => {
      const token = createMockAPIToken();
      mockPrisma.aPIToken.findMany.mockResolvedValue([token]);

      const response = await GET();
      const data = await response.json();

      expect(data.tokens[0].tokenHash).toBeUndefined();
    });
  });

  describe("POST /api/tokens", () => {
    // TC-TOKEN-001: Successfully generate new API token
    it("creates a new token with valid data", async () => {
      mockPrisma.aPIToken.count.mockResolvedValue(0); // No existing tokens
      mockPrisma.aPIToken.create.mockResolvedValue({
        id: "new-token-id",
        name: "My API Token",
        permissions: ["read", "create"],
        createdAt: new Date(),
      });

      const request = createMockRequest("POST", {
        name: "My API Token",
        permissions: ["read", "create"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.token).toBeDefined();
      expect(data.token.name).toBe("My API Token");
      expect(data.token.plainToken).toBeDefined();
      expect(data.token.plainToken).toMatch(/^sh_live_/);
      expect(data.message).toContain("copy it now");
    });

    // TC-TOKEN-030: Token stored as bcrypt hash
    it("stores token as bcrypt hash, not plain text", async () => {
      mockPrisma.aPIToken.count.mockResolvedValue(0);
      mockPrisma.aPIToken.create.mockResolvedValue({
        id: "new-token-id",
        name: "Test Token",
        permissions: ["read"],
        createdAt: new Date(),
      });

      const request = createMockRequest("POST", {
        name: "Test Token",
        permissions: ["read"],
      });

      await POST(request);

      // Verify create was called with tokenHash (not plain token)
      // The tokenHash should be a bcrypt hash (starts with $2b$ or $2a$) or our mock hash (starts with hashed_)
      expect(mockPrisma.aPIToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tokenHash: expect.stringMatching(/^(\$2[ab]\$|hashed_)/), // bcrypt hash or mock hash
            tokenPrefix: expect.any(String),
          }),
        })
      );
    });

    // TC-TOKEN-004: Cannot generate more than 10 tokens
    it("returns 400 when user has 10 active tokens", async () => {
      mockPrisma.aPIToken.count.mockResolvedValue(10); // At limit

      const request = createMockRequest("POST", {
        name: "New Token",
        permissions: ["read"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Maximum of 10");
    });

    it("allows creation when user has less than 10 tokens", async () => {
      mockPrisma.aPIToken.count.mockResolvedValue(9);
      mockPrisma.aPIToken.create.mockResolvedValue({
        id: "new-token-id",
        name: "Token at limit",
        permissions: ["read"],
        createdAt: new Date(),
      });

      const request = createMockRequest("POST", {
        name: "Token at limit",
        permissions: ["read"],
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("returns 401 when user is not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValueOnce(null);

      const request = createMockRequest("POST", {
        name: "Test Token",
        permissions: ["read"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    // TC-TOKEN-005: Token name is required
    it("returns 400 when name is missing", async () => {
      const request = createMockRequest("POST", {
        name: "",
        permissions: ["read"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details?.name).toBeDefined();
    });

    it("returns 400 when permissions array is empty", async () => {
      const request = createMockRequest("POST", {
        name: "Test Token",
        permissions: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details?.permissions).toBeDefined();
    });

    it("returns 400 for invalid permission type", async () => {
      const request = createMockRequest("POST", {
        name: "Test Token",
        permissions: ["read", "invalid"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    // TC-TOKEN-031: Token prefix format
    it("generates token with correct prefix format", async () => {
      mockPrisma.aPIToken.count.mockResolvedValue(0);
      mockPrisma.aPIToken.create.mockResolvedValue({
        id: "new-token-id",
        name: "Test Token",
        permissions: ["read"],
        createdAt: new Date(),
      });

      const request = createMockRequest("POST", {
        name: "Test Token",
        permissions: ["read"],
      });

      const response = await POST(request);
      const data = await response.json();

      // Token format: sh_live_ + 32 chars
      expect(data.token.plainToken).toMatch(/^sh_live_[A-Za-z0-9_-]{32}$/);
    });

    it("handles database errors gracefully", async () => {
      mockPrisma.aPIToken.count.mockResolvedValue(0);
      mockPrisma.aPIToken.create.mockRejectedValue(new Error("DB Error"));

      const request = createMockRequest("POST", {
        name: "Test Token",
        permissions: ["read"],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to create");
    });
  });
});
