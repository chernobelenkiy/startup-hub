import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBestTranslation } from "@/lib/translations/project-translations";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/projects/public/[slug]
 * Get a single project by slug for public viewing
 * - Visible projects are accessible to everyone
 * - Hidden projects are only accessible to their owner
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { slug } = await params;
    
    // Get locale from header
    const headerLocale = request.headers.get("Accept-Language")?.split(",")[0]?.split("-")[0] ?? "ru";
    
    // Try to get authenticated user (optional)
    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session?.user?.id ?? null;
    } catch {
      // Auth failed - continue as unauthenticated
    }

    // Fetch project by slug
    const project = await db.project.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }, // Also allow lookup by ID
        ],
      },
      include: {
        translations: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
            title: true,
            company: true,
            socialLinks: true,
            openToContact: true,
          },
        },
        likes: userId
          ? {
              where: { userId },
              select: { userId: true },
            }
          : undefined,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check visibility
    // Hidden projects can only be accessed by their owner
    if (!project.visible && project.ownerId !== userId) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Resolve translation
    const translation = getBestTranslation(project.translations, headerLocale);
    const { likes, translations, ...rest } = project;

    const responseProject = {
      id: rest.id,
      slug: rest.slug,
      title: translation?.title ?? rest.title ?? "",
      shortDescription: translation?.shortDescription ?? rest.shortDescription ?? "",
      pitch: translation?.pitch ?? rest.pitch ?? "",
      traction: translation?.traction ?? rest.traction,
      investmentDetails: translation?.investmentDetails ?? rest.investmentDetails,
      screenshotUrl: rest.screenshotUrl,
      websiteUrl: rest.websiteUrl,
      status: rest.status,
      estimatedLaunch: rest.estimatedLaunch,
      needsInvestment: rest.needsInvestment,
      teamMembers: rest.teamMembers,
      lookingFor: rest.lookingFor,
      tags: rest.tags,
      likesCount: rest.likesCount,
      visible: rest.visible,
      language: translation?.language ?? rest.language,
      createdAt: rest.createdAt,
      updatedAt: rest.updatedAt,
      owner: rest.owner,
      isLiked: Boolean(userId && likes?.length),
      translations: translations.map((t) => ({
        language: t.language,
        title: t.title,
        shortDescription: t.shortDescription,
      })),
    };

    return NextResponse.json({ project: responseProject });
  } catch (error) {
    console.error("[API] Get public project error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
