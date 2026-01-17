import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCommentSchema } from "@/lib/validations/comment";

interface CommentWithReplies {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  parentId: string | null;
  likesCount: number;
  isLiked: boolean;
  isEdited: boolean;
  createdAt: string;
  replies?: CommentWithReplies[];
}

/**
 * GET /api/projects/[id]/comments - List comments for a project
 * Returns nested comment tree with up to 3 levels of nesting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch all comments for this project
    const comments = await db.comment.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
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
        likes: userId
          ? {
              where: { userId },
              take: 1,
            }
          : false,
      },
    });

    // Build nested comment tree
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // Type for comment with includes
    type CommentWithIncludes = typeof comments[number];

    // First pass: convert all comments to the right format
    for (const comment of comments as CommentWithIncludes[]) {
      const formattedComment: CommentWithReplies = {
        id: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        author: comment.author,
        parentId: comment.parentId,
        likesCount: comment._count.likes,
        isLiked: Array.isArray(comment.likes) && comment.likes.length > 0,
        isEdited: comment.isEdited,
        createdAt: comment.createdAt.toISOString(),
        replies: [],
      };
      commentMap.set(comment.id, formattedComment);
    }

    // Second pass: build the tree
    for (const comment of commentMap.values()) {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        } else {
          // Orphaned comment (parent deleted), treat as root
          rootComments.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    }

    // Sort root comments by newest first
    rootComments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ comments: rootComments });
  } catch (error) {
    console.error("[GET /api/projects/[id]/comments] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/comments - Create a new comment
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

    const { id: projectId } = await params;

    // Verify project exists and is visible
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, visible: true, ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check visibility - only owner can comment on hidden projects
    if (!project.visible && project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = createCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { content, parentId } = validationResult.data;

    // If parentId is provided, verify parent comment exists and belongs to this project
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
        select: { id: true, projectId: true },
      });

      if (!parentComment || parentComment.projectId !== projectId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 400 }
        );
      }
    }

    const comment = await db.comment.create({
      data: {
        content,
        projectId,
        authorId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          content: comment.content,
          authorId: comment.authorId,
          author: comment.author,
          parentId: comment.parentId,
          likesCount: 0,
          isLiked: false,
          isEdited: false,
          createdAt: comment.createdAt.toISOString(),
          replies: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/projects/[id]/comments] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
