import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createProjectSchema,
  createProjectWithTranslationsSchema,
} from "@/lib/validations/project";
import { generateSlug } from "@/lib/utils";
import {
  resolveProjectTranslation,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from "@/lib/translations/project-translations";

/**
 * GET /api/projects
 * List all projects for the current user with resolved translations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's locale from header or default to configured fallback
    const locale = request.headers.get("Accept-Language")?.split(",")[0]?.split("-")[0] || DEFAULT_LANGUAGE;

    const projects = await db.project.findMany({
      where: {
        ownerId: session.user.id,
      },
      include: {
        translations: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Resolve translations for each project
    const resolvedProjects = projects.map((project) => {
      const resolved = resolveProjectTranslation(project, locale);
      return {
        id: resolved.id,
        slug: resolved.slug,
        title: resolved.title,
        shortDescription: resolved.shortDescription,
        status: resolved.status,
        likesCount: resolved.likesCount,
        tags: resolved.tags,
        createdAt: resolved.createdAt,
        updatedAt: resolved.updatedAt,
        language: resolved.language,
        availableLanguages: resolved.translations.map((t) => t.language),
      };
    });

    return NextResponse.json({ projects: resolvedProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project with translations support
 *
 * Supports two input formats:
 * 1. Legacy format with `title`, `shortDescription`, `pitch`, `language` (creates single translation)
 * 2. New format with `translations: { en: {...}, ru: {...} }` (creates multiple translations)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if using new translations format
    if (body.translations) {
      const validationResult = createProjectWithTranslationsSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.flatten(),
          },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      // Get title from first available translation for slug generation
      const primaryTranslation = data.translations.ru || data.translations.en;
      const slug = generateSlug(primaryTranslation!.title!);

      // Create project with translations
      const project = await db.project.create({
        data: {
          slug,
          ownerId: session.user.id,
          // Legacy fields (kept for backward compatibility)
          title: primaryTranslation!.title,
          shortDescription: primaryTranslation!.shortDescription,
          pitch: primaryTranslation!.pitch,
          traction: primaryTranslation!.traction,
          investmentDetails: data.needsInvestment ? primaryTranslation!.investmentDetails : null,
          // Non-translatable fields
          websiteUrl: data.websiteUrl || null,
          screenshotUrl: data.screenshotUrl || null,
          status: data.status,
          estimatedLaunch: data.estimatedLaunch || null,
          needsInvestment: data.needsInvestment,
          teamMembers: data.teamMembers,
          lookingFor: data.lookingFor,
          tags: data.tags,
          language: data.translations.ru ? "ru" : "en",
          // Create translations
          translations: {
            create: Object.entries(data.translations)
              .filter(([, translation]) =>
                translation?.title && translation?.shortDescription && translation?.pitch
              )
              .map(([lang, translation]) => ({
                language: lang as SupportedLanguage,
                title: translation!.title!,
                shortDescription: translation!.shortDescription!,
                pitch: translation!.pitch!,
                traction: translation!.traction ?? null,
                investmentDetails: data.needsInvestment ? translation!.investmentDetails ?? null : null,
              })),
          },
        },
        include: {
          translations: true,
        },
      });

      return NextResponse.json(
        {
          project: {
            id: project.id,
            slug: project.slug,
            title: project.title,
            shortDescription: project.shortDescription,
            status: project.status,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            translations: project.translations,
          },
        },
        { status: 201 }
      );
    }

    // Legacy format - single language
    const validationResult = createProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const slug = generateSlug(data.title);

    // Create project with single translation
    const project = await db.project.create({
      data: {
        slug,
        ownerId: session.user.id,
        // Legacy fields
        title: data.title,
        shortDescription: data.shortDescription,
        pitch: data.pitch,
        traction: data.traction,
        investmentDetails: data.needsInvestment ? data.investmentDetails : null,
        // Non-translatable fields
        websiteUrl: data.websiteUrl || null,
        screenshotUrl: data.screenshotUrl || null,
        status: data.status,
        estimatedLaunch: data.estimatedLaunch || null,
        needsInvestment: data.needsInvestment,
        teamMembers: data.teamMembers,
        lookingFor: data.lookingFor,
        tags: data.tags,
        language: data.language,
        // Create translation record
        translations: {
          create: {
            language: data.language,
            title: data.title,
            shortDescription: data.shortDescription,
            pitch: data.pitch,
            traction: data.traction,
            investmentDetails: data.needsInvestment ? data.investmentDetails : null,
          },
        },
      },
      include: {
        translations: true,
      },
    });

    return NextResponse.json(
      {
        project: {
          id: project.id,
          slug: project.slug,
          title: project.title,
          shortDescription: project.shortDescription,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
