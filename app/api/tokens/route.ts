import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { TOKEN_PREFIX, extractTokenPrefix } from "@/lib/mcp-auth";

/**
 * Maximum number of active tokens per user
 */
const MAX_ACTIVE_TOKENS = 10;

/**
 * Validation schema for token creation
 */
const createTokenSchema = z.object({
  name: z
    .string()
    .min(1, "Token name is required")
    .max(100, "Token name must be at most 100 characters"),
  permissions: z
    .array(z.enum(["read", "create", "update", "delete"]))
    .min(1, "At least one permission is required")
    .default(["read"]),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

/**
 * GET /api/tokens
 * List all API tokens for the current user (without revealing the hash)
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch tokens with revokedAt to determine status
    const tokens = await db.aPIToken.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map tokens with status derived from revokedAt
    const mappedTokens = tokens.map((token) => ({
      id: token.id,
      name: token.name,
      permissions: token.permissions,
      lastUsedAt: token.lastUsedAt,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      status: token.revokedAt ? "revoked" : "active",
    }));

    return NextResponse.json({ tokens: mappedTokens });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tokens
 * Generate a new API token
 * Returns the plain token ONCE - it cannot be retrieved again
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = createTokenSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, permissions, expiresAt } = validationResult.data;

    // Check active token limit using Prisma
    const activeCount = await db.aPIToken.count({
      where: {
        userId: session.user.id,
        revokedAt: null, // Token is active if not revoked
      },
    });

    if (activeCount >= MAX_ACTIVE_TOKENS) {
      return NextResponse.json(
        {
          error: `Maximum of ${MAX_ACTIVE_TOKENS} active tokens reached. Please revoke an existing token first.`,
        },
        { status: 400 }
      );
    }

    // Generate the token
    const plainToken = `${TOKEN_PREFIX}${nanoid(32)}`;

    // Extract prefix for efficient lookup
    const tokenPrefix = extractTokenPrefix(plainToken);

    // Hash the token with bcrypt (12 rounds)
    const tokenHash = await bcrypt.hash(plainToken, 12);

    // Store the token in database
    const token = await db.aPIToken.create({
      data: {
        userId: session.user.id,
        tokenPrefix,
        tokenHash,
        name,
        permissions,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        permissions: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Return the plain token - this is the ONLY time it will be visible
    return NextResponse.json(
      {
        token: {
          ...token,
          plainToken,
          status: "active",
        },
        message:
          "Token created successfully. Make sure to copy it now - you won't be able to see it again!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating token:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
