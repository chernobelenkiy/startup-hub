import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  updateProjectSchema,
  updateTranslationSchema,
  translationsSchema,
} from "@/lib/validations/project";
import { resolveProjectTranslation, type SupportedLanguage } from "@/lib/translations/project-translations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]
 * Get a single project by ID with all translations (ownership check)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const project = await db.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        translations: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Return project with all translations for editing
    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update a project with translations support (ownership check)
 *
 * Supports two update modes:
 * 1. Legacy format - updates project fields directly (single language)
 * 2. Translations format - updates specific translation by language
 * 3. Full translations format - updates all translations at once
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if project exists and user owns it
    const existingProject = await db.project.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (existingProject.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if updating with full translations object
    if (body.translations) {
      const translationsValidation = translationsSchema.safeParse(body.translations);

      if (!translationsValidation.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: translationsValidation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const translations = translationsValidation.data;

      // Update non-translatable fields
      const projectUpdateData: Record<string, unknown> = {};
      if (body.websiteUrl !== undefined) projectUpdateData.websiteUrl = body.websiteUrl || null;
      if (body.screenshotUrl !== undefined) projectUpdateData.screenshotUrl = body.screenshotUrl || null;
      if (body.status !== undefined) projectUpdateData.status = body.status;
      if (body.estimatedLaunch !== undefined) projectUpdateData.estimatedLaunch = body.estimatedLaunch || null;
      if (body.needsInvestment !== undefined) projectUpdateData.needsInvestment = body.needsInvestment;
      if (body.teamMembers !== undefined) projectUpdateData.teamMembers = body.teamMembers;
      if (body.lookingFor !== undefined) projectUpdateData.lookingFor = body.lookingFor;
      if (body.tags !== undefined) projectUpdateData.tags = body.tags;

      // Update legacy fields from primary translation
      const primaryTranslation = translations.ru || translations.en;
      if (primaryTranslation?.title) projectUpdateData.title = primaryTranslation.title;
      if (primaryTranslation?.shortDescription) projectUpdateData.shortDescription = primaryTranslation.shortDescription;
      if (primaryTranslation?.pitch) projectUpdateData.pitch = primaryTranslation.pitch;
      if (primaryTranslation?.traction !== undefined) projectUpdateData.traction = primaryTranslation.traction;
      if (primaryTranslation?.investmentDetails !== undefined) {
        projectUpdateData.investmentDetails = body.needsInvestment ? primaryTranslation.investmentDetails : null;
      }

      // Upsert translations
      const translationPromises: Promise<unknown>[] = [];

      for (const lang of ["en", "ru"] as SupportedLanguage[]) {
        const translation = translations[lang];
        if (translation?.title && translation?.shortDescription && translation?.pitch) {
          translationPromises.push(
            db.projectTranslation.upsert({
              where: {
                projectId_language: { projectId: id, language: lang },
              },
              update: {
                title: translation.title,
                shortDescription: translation.shortDescription,
                pitch: translation.pitch,
                traction: translation.traction ?? null,
                investmentDetails: body.needsInvestment ? translation.investmentDetails ?? null : null,
              },
              create: {
                projectId: id,
                language: lang,
                title: translation.title,
                shortDescription: translation.shortDescription,
                pitch: translation.pitch,
                traction: translation.traction ?? null,
                investmentDetails: body.needsInvestment ? translation.investmentDetails ?? null : null,
              },
            })
          );
        }
      }

      await Promise.all([
        db.project.update({ where: { id }, data: projectUpdateData }),
        ...translationPromises,
      ]);

      // Fetch updated project
      const updatedProject = await db.project.findUnique({
        where: { id },
        include: {
          translations: true,
          owner: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      return NextResponse.json({ project: updatedProject });
    }

    // Legacy format - single language update
    const validationResult = updateProjectSchema.safeParse(body);

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

    // Build update data object
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.pitch !== undefined) updateData.pitch = data.pitch;
    if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl || null;
    if (data.screenshotUrl !== undefined) updateData.screenshotUrl = data.screenshotUrl || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.estimatedLaunch !== undefined) updateData.estimatedLaunch = data.estimatedLaunch || null;
    if (data.needsInvestment !== undefined) updateData.needsInvestment = data.needsInvestment;
    if (data.investmentDetails !== undefined) {
      updateData.investmentDetails = data.needsInvestment ? data.investmentDetails : null;
    }
    if (data.teamMembers !== undefined) updateData.teamMembers = data.teamMembers;
    if (data.lookingFor !== undefined) updateData.lookingFor = data.lookingFor;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.traction !== undefined) updateData.traction = data.traction || null;

    // Determine the target language for translation update
    const targetLanguage = (data.language || existingProject.language) as SupportedLanguage;

    // Build translation update data
    const translationUpdateData: Record<string, unknown> = {};
    if (data.title !== undefined) translationUpdateData.title = data.title;
    if (data.shortDescription !== undefined) translationUpdateData.shortDescription = data.shortDescription;
    if (data.pitch !== undefined) translationUpdateData.pitch = data.pitch;
    if (data.traction !== undefined) translationUpdateData.traction = data.traction || null;
    if (data.investmentDetails !== undefined) {
      translationUpdateData.investmentDetails = data.needsInvestment ? data.investmentDetails : null;
    }

    // Update project and translation
    const [project] = await Promise.all([
      db.project.update({
        where: { id },
        data: updateData,
        include: {
          translations: true,
        },
      }),
      // Upsert the translation for the specified language
      Object.keys(translationUpdateData).length > 0
        ? db.projectTranslation.upsert({
            where: {
              projectId_language: { projectId: id, language: targetLanguage },
            },
            update: translationUpdateData,
            create: {
              projectId: id,
              language: targetLanguage,
              title: data.title || existingProject.title || "",
              shortDescription: data.shortDescription || existingProject.shortDescription || "",
              pitch: data.pitch || existingProject.pitch || "",
              traction: data.traction ?? existingProject.traction,
              investmentDetails: data.investmentDetails ?? existingProject.investmentDetails,
            },
          })
        : Promise.resolve(),
    ]);

    // Resolve with the updated translation
    const resolved = resolveProjectTranslation(project, targetLanguage);

    return NextResponse.json({
      project: {
        id: resolved.id,
        slug: resolved.slug,
        title: resolved.title,
        shortDescription: resolved.shortDescription,
        pitch: resolved.pitch,
        websiteUrl: project.websiteUrl,
        screenshotUrl: project.screenshotUrl,
        status: project.status,
        estimatedLaunch: project.estimatedLaunch,
        needsInvestment: project.needsInvestment,
        investmentDetails: resolved.investmentDetails,
        traction: resolved.traction,
        teamMembers: project.teamMembers,
        lookingFor: project.lookingFor,
        tags: project.tags,
        language: resolved.language,
        likesCount: project.likesCount,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        translations: project.translations,
      },
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project (ownership check, cascades to likes)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if project exists and user owns it
    const existingProject = await db.project.findUnique({
      where: { id },
      select: { ownerId: true, title: true },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (existingProject.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete project (likes will be cascade deleted via Prisma schema)
    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Project deleted successfully",
      title: existingProject.title,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
