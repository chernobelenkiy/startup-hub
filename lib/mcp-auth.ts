import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * MCP API Token Authentication Middleware
 *
 * Authenticates requests using Bearer tokens with the format: sh_live_<32 chars>
 * Tokens are stored as bcrypt hashes with a prefix for efficient lookup.
 */

/**
 * Token prefix for Startup Hub API tokens
 */
export const TOKEN_PREFIX = "sh_live_";

/**
 * Length of the prefix hint stored in database for faster lookup
 */
export const TOKEN_PREFIX_LENGTH = 8;

/**
 * Permission types for API tokens
 */
export type TokenPermission = "read" | "create" | "update" | "delete";

/**
 * Error codes for MCP API authentication
 */
export const MCP_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type MCPErrorCode = (typeof MCP_ERROR_CODES)[keyof typeof MCP_ERROR_CODES];

/**
 * Result of successful authentication
 */
export interface AuthenticatedUser {
  userId: string;
  tokenId: string;
  permissions: TokenPermission[];
}

/**
 * Result of authentication attempt
 */
export type AuthResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; error: string; code: MCPErrorCode };

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Validate token format (sh_live_ prefix + 32 chars)
 */
function isValidTokenFormat(token: string): boolean {
  if (!token.startsWith(TOKEN_PREFIX)) {
    return false;
  }

  const tokenBody = token.slice(TOKEN_PREFIX.length);
  // nanoid(32) generates 32 characters using [A-Za-z0-9_-]
  return tokenBody.length === 32 && /^[A-Za-z0-9_-]+$/.test(tokenBody);
}

/**
 * Extract the prefix hint from a token for database lookup
 */
export function extractTokenPrefix(token: string): string {
  const tokenBody = token.slice(TOKEN_PREFIX.length);
  return tokenBody.slice(0, TOKEN_PREFIX_LENGTH);
}

/**
 * Authenticate an MCP API request using Bearer token
 *
 * @param request - The incoming Next.js request
 * @returns Authentication result with user info or error
 */
export async function authenticateMCPRequest(
  request: NextRequest
): Promise<AuthResult> {
  try {
    // Extract token from header
    const token = extractBearerToken(request);

    if (!token) {
      return {
        success: false,
        error: "Missing or invalid Authorization header. Use: Bearer <token>",
        code: MCP_ERROR_CODES.UNAUTHORIZED,
      };
    }

    // Validate token format
    if (!isValidTokenFormat(token)) {
      return {
        success: false,
        error: "Invalid token format",
        code: MCP_ERROR_CODES.UNAUTHORIZED,
      };
    }

    // Extract prefix for efficient lookup
    const tokenPrefix = extractTokenPrefix(token);

    // Find potential matching tokens by prefix
    const candidateTokens = await db.aPIToken.findMany({
      where: {
        tokenPrefix,
        revokedAt: null, // Only consider non-revoked tokens
      },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
        permissions: true,
        expiresAt: true,
      },
    });

    if (candidateTokens.length === 0) {
      return {
        success: false,
        error: "Invalid token",
        code: MCP_ERROR_CODES.UNAUTHORIZED,
      };
    }

    // Find the matching token by comparing bcrypt hashes
    let matchedToken: (typeof candidateTokens)[0] | null = null;

    for (const candidate of candidateTokens) {
      const isMatch = await bcrypt.compare(token, candidate.tokenHash);
      if (isMatch) {
        matchedToken = candidate;
        break;
      }
    }

    if (!matchedToken) {
      return {
        success: false,
        error: "Invalid token",
        code: MCP_ERROR_CODES.UNAUTHORIZED,
      };
    }

    // Check if token has expired
    if (matchedToken.expiresAt && matchedToken.expiresAt < new Date()) {
      return {
        success: false,
        error: "Token has expired",
        code: MCP_ERROR_CODES.UNAUTHORIZED,
      };
    }

    // Update lastUsedAt asynchronously (fire and forget)
    db.aPIToken
      .update({
        where: { id: matchedToken.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => {
        console.error("Failed to update token lastUsedAt:", err);
      });

    return {
      success: true,
      user: {
        userId: matchedToken.userId,
        tokenId: matchedToken.id,
        permissions: matchedToken.permissions as TokenPermission[],
      },
    };
  } catch (error) {
    console.error("MCP authentication error:", error);
    return {
      success: false,
      error: "Authentication failed",
      code: MCP_ERROR_CODES.INTERNAL_ERROR,
    };
  }
}

/**
 * Check if user has required permission
 */
export function hasPermission(
  permissions: TokenPermission[],
  required: TokenPermission
): boolean {
  return permissions.includes(required);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(
  permissions: TokenPermission[],
  required: TokenPermission[]
): boolean {
  return required.some((perm) => permissions.includes(perm));
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(
  permissions: TokenPermission[],
  required: TokenPermission[]
): boolean {
  return required.every((perm) => permissions.includes(perm));
}
