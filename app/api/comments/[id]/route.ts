import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateCommentSchema } from "@/lib/validations/comment";

/**
 * PUT /api/comments/[id] - Update a comment
 * Only the author can update their comment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: commentId } = await params;

    // Find the comment
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check ownership
    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = updateCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { content } = validationResult.data;

    const updatedComment = await db.comment.update({
      where: { id: commentId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    return NextResponse.json({
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        authorId: updatedComment.authorId,
        author: updatedComment.author,
        parentId: updatedComment.parentId,
        likesCount: updatedComment._count.likes,
        isEdited: updatedComment.isEdited,
        createdAt: updatedComment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[PUT /api/comments/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id] - Delete a comment
 * Only the author can delete their comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: commentId } = await params;

    // Find the comment
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check ownership
    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prisma schema has onDelete: Cascade configured for:
    // - CommentLike.comment -> Comment (likes are deleted when comment is deleted)
    // - Comment.parent -> Comment (replies are deleted when parent is deleted)
    // So we only need to delete the comment itself
    await db.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/comments/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
