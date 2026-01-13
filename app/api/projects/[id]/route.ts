import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProjectSchema } from "@/lib/validations/project";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]
 * Get a single project by ID (ownership check)
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
 * Update a project (ownership check)
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
      select: { ownerId: true },
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

    // Validate request body
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

    // Build update data object, only including provided fields
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

    // Update project
    const project = await db.project.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        pitch: true,
        websiteUrl: true,
        screenshotUrl: true,
        status: true,
        estimatedLaunch: true,
        needsInvestment: true,
        investmentDetails: true,
        traction: true,
        teamMembers: true,
        lookingFor: true,
        tags: true,
        language: true,
        likesCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ project });
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
