import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { db, ProjectStatus } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getBestTranslation, DEFAULT_LANGUAGE } from "@/lib/translations/project-translations";

const querySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  roles: z.string().optional(),
  investment: z.enum(["true", "false"]).optional(),
  tags: z.string().optional(),
  sort: z.enum(["newest", "oldest", "mostLiked"]).default("newest"),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  locale: z.string().optional(),
});

type SortOption = z.infer<typeof querySchema>["sort"];

/**
 * GET /api/projects/public
 * Public project listing with filtering, sorting, and cursor-based pagination.
 * Returns isLiked field if user is authenticated.
 * Supports multilingual content via locale parameter or Accept-Language header.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get authenticated user (optional - failures are treated as unauthenticated)
    const session = await auth().catch(() => null);
    const userId = session?.user?.id;

    const headerLocale = request.headers.get("Accept-Language")?.split(",")[0]?.split("-")[0];

    const queryResult = querySchema.safeParse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      roles: searchParams.get("roles") || undefined,
      investment: searchParams.get("investment") || undefined,
      tags: searchParams.get("tags") || undefined,
      sort: searchParams.get("sort") || "newest",
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || 20,
      locale: searchParams.get("locale") || headerLocale || DEFAULT_LANGUAGE,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { search, status, roles, investment, tags, sort, cursor, limit, locale } =
      queryResult.data;

    // Parse comma-separated values
    const statusArray = status
      ? (status.split(",").filter(Boolean) as ProjectStatus[])
      : [];
    const rolesArray = roles ? roles.split(",").filter(Boolean) : [];
    const tagsArray = tags ? tags.split(",").filter(Boolean) : [];

    // Build where clause
    const where: Prisma.ProjectWhereInput = {
      // Only show visible projects in public listings
      visible: true,
    };

    // Search filter - search across translations table as well
    if (search) {
      where.OR = [
        // Search in legacy fields
        { title: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        // Search in translations
        {
          translations: {
            some: {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { shortDescription: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
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

    // Fetch projects with translations
    const projects = await db.project.findMany({
      where,
      orderBy,
      take: limit + 1,
      cursor: cursorClause,
      skip: cursorClause ? 1 : 0,
      include: {
        translations: true,
        owner: {
          select: { id: true, name: true, image: true },
        },
        likes: {
          where: userId ? { userId } : { userId: "__none__" },
          select: { userId: true },
        },
      },
    });

    const hasMore = projects.length > limit;
    const items = hasMore ? projects.slice(0, limit) : projects;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    const resultProjects = items.map((project) => {
      const { likes, translations, owner, ...rest } = project;
      const translation = getBestTranslation(translations, locale ?? DEFAULT_LANGUAGE);

      return {
        id: rest.id,
        slug: rest.slug,
        title: translation?.title ?? rest.title ?? "",
        shortDescription: translation?.shortDescription ?? rest.shortDescription ?? "",
        screenshotUrl: rest.screenshotUrl,
        websiteUrl: rest.websiteUrl,
        status: rest.status,
        tags: rest.tags,
        lookingFor: rest.lookingFor,
        likesCount: rest.likesCount,
        teamMembers: rest.teamMembers,
        needsInvestment: rest.needsInvestment,
        createdAt: rest.createdAt,
        owner,
        isLiked: Boolean(userId && likes.length > 0),
        language: translation?.language ?? rest.language,
      };
    });

    return NextResponse.json({
      projects: resultProjects,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("[api/projects/public] Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

const ORDER_BY_MAP: Record<SortOption, Prisma.ProjectOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  mostLiked: [{ likesCount: "desc" }, { createdAt: "desc" }, { id: "desc" }],
};

function buildOrderBy(sort: SortOption): Prisma.ProjectOrderByWithRelationInput[] {
  return ORDER_BY_MAP[sort] ?? ORDER_BY_MAP.newest;
}
