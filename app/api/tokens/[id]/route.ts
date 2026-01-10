import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * DELETE /api/tokens/[id]
 * Revoke a token by setting revokedAt timestamp
 * The token is not deleted from the database for audit purposes
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Single query to check existence, ownership, and revoked status
    const existingToken = await db.aPIToken.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        name: true,
        revokedAt: true,
      },
    });

    if (!existingToken) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    if (existingToken.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to revoke this token" },
        { status: 403 }
      );
    }

    if (existingToken.revokedAt !== null) {
      return NextResponse.json(
        { error: "Token is already revoked" },
        { status: 400 }
      );
    }

    await db.aPIToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({
      message: "Token revoked successfully",
      token: {
        id: existingToken.id,
        name: existingToken.name,
        status: "revoked",
      },
    });
  } catch (error) {
    console.error("Error revoking token:", error);
    return NextResponse.json(
      { error: "Failed to revoke token" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tokens/[id]
 * Get details of a specific token
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch token details including revokedAt
    const token = await db.aPIToken.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        name: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Ownership check
    if (token.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to view this token" },
        { status: 403 }
      );
    }

    // Determine status from revokedAt
    const status = token.revokedAt ? "revoked" : "active";

    return NextResponse.json({
      token: {
        id: token.id,
        name: token.name,
        permissions: token.permissions,
        lastUsedAt: token.lastUsedAt,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
        status,
      },
    });
  } catch (error) {
    console.error("Error fetching token:", error);
    return NextResponse.json(
      { error: "Failed to fetch token" },
      { status: 500 }
    );
  }
}
