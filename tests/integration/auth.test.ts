import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, createMockUser } from "../utils/helpers";

/**
 * Integration Tests for Auth API Routes
 *
 * Test Cases Covered:
 * - TC-AUTH-001: Successful registration (P0)
 * - TC-AUTH-002: Registration fails with duplicate email (P0)
 * - TC-AUTH-004: Password validation in API (P0)
 */

// Mock modules before imports - vi.mock is hoisted
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    account: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Import after mocks are set up
import { POST } from "@/app/api/auth/register/route";
import { db } from "@/lib/db";

// Cast to mocked type
const mockDb = vi.mocked(db);

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-AUTH-001: Successful registration with valid email and password
  it("successfully registers a new user with valid credentials", async () => {
    const mockUser = createMockUser({
      id: "new-user-id",
      email: "newuser@example.com",
    });

    // User does not exist
    mockDb.user.findUnique.mockResolvedValue(null);

    // Transaction creates user successfully
    mockDb.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue(mockUser),
        },
        account: {
          create: vi.fn().mockResolvedValue({}),
        },
      });
    });

    const request = createMockRequest("POST", {
      email: "newuser@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("newuser@example.com");
  });

  // TC-AUTH-002: Registration fails with already registered email
  it("returns 409 when email is already registered", async () => {
    const existingUser = createMockUser({
      email: "existing@example.com",
    });

    // User exists
    mockDb.user.findUnique.mockResolvedValue(existingUser as never);

    const request = createMockRequest("POST", {
      email: "existing@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain("already exists");
  });

  // TC-AUTH-004: Registration fails when password is less than 8 characters
  it("returns 400 when password is too short", async () => {
    const request = createMockRequest("POST", {
      email: "user@example.com",
      password: "Pass1", // Too short
      confirmPassword: "Pass1",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details?.password).toBeDefined();
  });

  // TC-AUTH-005: Registration fails when password has no number
  it("returns 400 when password has no number", async () => {
    const request = createMockRequest("POST", {
      email: "user@example.com",
      password: "PasswordOnly",
      confirmPassword: "PasswordOnly",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details?.password).toBeDefined();
  });

  it("returns 400 when passwords do not match", async () => {
    const request = createMockRequest("POST", {
      email: "user@example.com",
      password: "Password123",
      confirmPassword: "Password456",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details?.confirmPassword).toBeDefined();
  });

  it("returns 400 when email is invalid", async () => {
    const request = createMockRequest("POST", {
      email: "invalid-email",
      password: "Password123",
      confirmPassword: "Password123",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details?.email).toBeDefined();
  });

  it("normalizes email to lowercase", async () => {
    const mockUser = createMockUser({
      id: "new-user-id",
      email: "user@example.com",
    });

    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue(mockUser),
        },
        account: {
          create: vi.fn().mockResolvedValue({}),
        },
      });
    });

    const request = createMockRequest("POST", {
      email: "USER@EXAMPLE.COM",
      password: "Password123",
      confirmPassword: "Password123",
    });

    await POST(request);

    // Verify findUnique was called with lowercase email
    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
  });

  it("handles database errors gracefully", async () => {
    mockDb.user.findUnique.mockRejectedValue(new Error("DB Error"));

    const request = createMockRequest("POST", {
      email: "user@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("error occurred");
  });
});
