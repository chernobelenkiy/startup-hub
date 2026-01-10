import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, ProjectStatus } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";

/**
 * Query parameters schema for public project listing
 */
const querySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(), // Comma-separated statuses
  roles: z.string().optional(), // Comma-separated roles
  investment: z.enum(["true", "false"]).optional(),
  tags: z.string().optional(), // Comma-separated tags
  sort: z.enum(["newest", "oldest", "mostLiked"]).default("newest"),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

type SortOption = "newest" | "oldest" | "mostLiked";

/**
 * GET /api/projects/public
 * Public project listing with filtering, sorting, and cursor-based pagination
 * Returns isLiked field if user is authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check for authenticated user (optional for this endpoint)
    const session = await auth();
    const userId = session?.user?.id;

    // Parse and validate query parameters
    const queryResult = querySchema.safeParse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      roles: searchParams.get("roles") || undefined,
      investment: searchParams.get("investment") || undefined,
      tags: searchParams.get("tags") || undefined,
      sort: searchParams.get("sort") || "newest",
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || 20,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { search, status, roles, investment, tags, sort, cursor, limit } =
      queryResult.data;

    // Parse comma-separated values
    const statusArray = status
      ? (status.split(",").filter(Boolean) as ProjectStatus[])
      : [];
    const rolesArray = roles ? roles.split(",").filter(Boolean) : [];
    const tagsArray = tags ? tags.split(",").filter(Boolean) : [];

    // Build where clause
    const where: Prisma.ProjectWhereInput = {};

    // Search filter (title OR description, case-insensitive)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    // Status filter (OR logic - any selected status matches)
    if (statusArray.length > 0) {
      where.status = { in: statusArray };
    }

    // Roles filter (OR logic - looking for any selected role)
    if (rolesArray.length > 0) {
      where.lookingFor = { hasSome: rolesArray };
    }

    // Investment filter (exact match)
    if (investment !== undefined) {
      where.needsInvestment = investment === "true";
    }

    // Tags filter (AND logic - must have ALL selected tags)
    if (tagsArray.length > 0) {
      where.tags = { hasEvery: tagsArray };
    }

    // Build orderBy clause
    const orderBy = buildOrderBy(sort);

    // Build cursor clause for pagination
    const cursorClause = cursor ? { id: cursor } : undefined;

    // Fetch projects with conditional like status
    const projects = await db.project.findMany({
      where,
      orderBy,
      take: limit + 1, // Fetch one extra to determine if there are more
      cursor: cursorClause,
      skip: cursorClause ? 1 : 0, // Skip the cursor item itself
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        screenshotUrl: true,
        status: true,
        tags: true,
        lookingFor: true,
        likesCount: true,
        teamMembers: true,
        needsInvestment: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        // Include likes for the current user to determine isLiked
        likes: userId
          ? {
              where: { userId },
              select: { userId: true },
            }
          : false,
      },
    });

    // Determine if there are more results
    const hasMore = projects.length > limit;
    const rawProjects = hasMore ? projects.slice(0, limit) : projects;
    const nextCursor = hasMore ? rawProjects[rawProjects.length - 1]?.id : null;

    // Transform projects to include isLiked field
    const resultProjects = rawProjects.map((project) => {
      const { likes, ...rest } = project;
      return {
        ...rest,
        isLiked: userId ? (likes as { userId: string }[])?.length > 0 : false,
      };
    });

    return NextResponse.json({
      projects: resultProjects,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching public projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

/**
 * Build orderBy clause based on sort option
 */
function buildOrderBy(sort: SortOption) {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" as const }, { id: "desc" as const }];
    case "oldest":
      return [{ createdAt: "asc" as const }, { id: "asc" as const }];
    case "mostLiked":
      return [{ likesCount: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }];
    default:
      return [{ createdAt: "desc" as const }, { id: "desc" as const }];
  }
}
