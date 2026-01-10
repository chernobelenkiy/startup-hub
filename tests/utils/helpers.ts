import { vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Test utilities for Startup Hub tests
 */

// ============================================
// Mock User and Session Helpers
// ============================================

export interface MockUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface MockSession {
  user: MockUser;
  expires: string;
}

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    ...overrides,
  };
}

/**
 * Create a mock session for testing
 */
export function createMockSession(user?: MockUser): MockSession {
  return {
    user: user ?? createMockUser(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ============================================
// Mock API Token Helpers
// ============================================

export interface MockAPIToken {
  id: string;
  userId: string;
  tokenPrefix: string;
  tokenHash: string;
  name: string;
  permissions: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export const TOKEN_PREFIX = "sh_live_";

/**
 * Create a mock API token for testing
 */
export function createMockAPIToken(
  overrides?: Partial<MockAPIToken>
): MockAPIToken {
  const plainToken = `${TOKEN_PREFIX}${"x".repeat(32)}`;
  return {
    id: "test-token-id",
    userId: "test-user-id",
    tokenPrefix: plainToken.slice(TOKEN_PREFIX.length, TOKEN_PREFIX.length + 8),
    tokenHash: `hashed_${plainToken}`,
    name: "Test Token",
    permissions: ["read"],
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Generate a valid test token string
 */
export function generateTestToken(): string {
  return `${TOKEN_PREFIX}${"x".repeat(32)}`;
}

// ============================================
// Mock Project Helpers
// ============================================

export interface MockProject {
  id: string;
  slug: string;
  ownerId: string;
  title: string;
  shortDescription: string;
  pitch: string;
  websiteUrl: string | null;
  screenshotUrl: string | null;
  status: string;
  estimatedLaunch: Date | null;
  needsInvestment: boolean;
  investmentDetails: string | null;
  teamMembers: unknown[];
  lookingFor: string[];
  tags: string[];
  likesCount: number;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a mock project for testing
 */
export function createMockProject(
  overrides?: Partial<MockProject>
): MockProject {
  return {
    id: "test-project-id",
    slug: "test-project-xxxxxx",
    ownerId: "test-user-id",
    title: "Test Project",
    shortDescription: "A test project for testing purposes with enough chars",
    pitch:
      "This is a test pitch that needs to be at least twenty characters long for validation",
    websiteUrl: null,
    screenshotUrl: null,
    status: "IDEA",
    estimatedLaunch: null,
    needsInvestment: false,
    investmentDetails: null,
    teamMembers: [],
    lookingFor: [],
    tags: [],
    likesCount: 0,
    language: "en",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create valid project input data for testing
 */
export function createValidProjectInput() {
  return {
    title: "Test Project Title",
    shortDescription:
      "This is a test short description with at least ten chars",
    pitch:
      "This is a test pitch that is long enough to pass validation with at least twenty chars",
    status: "IDEA" as const,
  };
}

// ============================================
// Mock NextRequest Helpers
// ============================================

/**
 * Create a mock NextRequest for API testing
 */
export function createMockRequest(
  method: string = "GET",
  body?: unknown,
  headers?: Record<string, string>
): NextRequest {
  const url = "http://localhost:3000/api/test";

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init);
}

/**
 * Create a mock NextRequest with Bearer token
 */
export function createMockRequestWithToken(
  method: string = "GET",
  token: string,
  body?: unknown
): NextRequest {
  return createMockRequest(method, body, {
    Authorization: `Bearer ${token}`,
  });
}

// ============================================
// Mock Prisma Helpers
// ============================================

/**
 * Create a mock Prisma client for testing
 */
export function createMockPrismaClient() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    aPIToken: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        user: {
          create: vi.fn(),
        },
        account: {
          create: vi.fn(),
        },
        like: {
          create: vi.fn(),
          delete: vi.fn(),
        },
        project: {
          update: vi.fn(),
        },
      })
    ),
  };
}

// ============================================
// Response Assertion Helpers
// ============================================

/**
 * Parse JSON response from NextResponse
 */
export async function parseResponseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Assert response status and return parsed JSON
 */
export async function assertResponse<T>(
  response: Response,
  expectedStatus: number
): Promise<T> {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}. Body: ${body}`
    );
  }
  return response.json() as Promise<T>;
}

// ============================================
// Test Data Generators
// ============================================

/**
 * Generate a random email for testing
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}@example.com`;
}

/**
 * Generate a valid password for testing
 */
export function generateValidPassword(): string {
  return "Password123";
}

/**
 * Generate an invalid password (too short)
 */
export function generateInvalidPasswordShort(): string {
  return "Pass1";
}

/**
 * Generate an invalid password (no number)
 */
export function generateInvalidPasswordNoNumber(): string {
  return "PasswordOnly";
}
