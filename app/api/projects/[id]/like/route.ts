import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/projects/[id]/like
 * Toggle like status for a project (create or delete)
 * Uses Prisma transaction for atomic count updates
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to like a project" },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    const userId = session.user.id;

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Not Found", message: "Project not found" },
        { status: 404 }
      );
    }

    // Check if like already exists
    const existingLike = await db.like.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    // Use transaction to ensure atomic update of like and count
    if (existingLike) {
      // Unlike: Delete like and decrement count
      const result = await db.$transaction(async (tx) => {
        await tx.like.delete({
          where: {
            userId_projectId: {
              userId,
              projectId,
            },
          },
        });

        const updatedProject = await tx.project.update({
          where: { id: projectId },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
          select: {
            likesCount: true,
          },
        });

        return {
          liked: false,
          likesCount: Math.max(0, updatedProject.likesCount), // Ensure non-negative
        };
      });

      return NextResponse.json(result);
    } else {
      // Like: Create like and increment count
      const result = await db.$transaction(async (tx) => {
        await tx.like.create({
          data: {
            userId,
            projectId,
          },
        });

        const updatedProject = await tx.project.update({
          where: { id: projectId },
          data: {
            likesCount: {
              increment: 1,
            },
          },
          select: {
            likesCount: true,
          },
        });

        return {
          liked: true,
          likesCount: updatedProject.likesCount,
        };
      });

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error toggling like:", error);

    // Handle unique constraint violation (race condition)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Conflict", message: "Like operation already in progress" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/like
 * Get like status and count for a project
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    // Fetch project with like status
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        likesCount: true,
        likes: userId
          ? {
              where: { userId },
              select: { userId: true },
            }
          : false,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Not Found", message: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      liked: userId ? (project.likes as { userId: string }[])?.length > 0 : false,
      likesCount: project.likesCount,
    });
  } catch (error) {
    console.error("Error fetching like status:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch like status" },
      { status: 500 }
    );
  }
}
