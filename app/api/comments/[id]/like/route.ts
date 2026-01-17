import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/comments/[id]/like - Toggle like on a comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: commentId } = await params;
    const userId = session.user.id;

    // Verify comment exists
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user already liked
    const existingLike = await db.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    let liked: boolean;
    let likesCount: number;

    if (existingLike) {
      // Unlike
      await db.commentLike.delete({
        where: {
          userId_commentId: {
            userId,
            commentId,
          },
        },
      });
      liked = false;
    } else {
      // Like
      await db.commentLike.create({
        data: {
          userId,
          commentId,
        },
      });
      liked = true;
    }

    // Get updated count
    likesCount = await db.commentLike.count({
      where: { commentId },
    });

    return NextResponse.json({ liked, likesCount });
  } catch (error) {
    console.error("[POST /api/comments/[id]/like] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
