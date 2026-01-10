import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createProjectSchema } from "@/lib/validations/project";
import { generateSlug } from "@/lib/utils";

/**
 * GET /api/projects
 * List all projects for the current user
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const projects = await db.project.findMany({
      where: {
        ownerId: session.user.id,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        status: true,
        likesCount: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ projects });
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
 * Create a new project
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

    // Validate request body
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

    // Generate unique slug
    const slug = generateSlug(data.title);

    // Create project
    const project = await db.project.create({
      data: {
        slug,
        ownerId: session.user.id,
        title: data.title,
        shortDescription: data.shortDescription,
        pitch: data.pitch,
        websiteUrl: data.websiteUrl || null,
        screenshotUrl: data.screenshotUrl || null,
        status: data.status,
        estimatedLaunch: data.estimatedLaunch || null,
        needsInvestment: data.needsInvestment,
        investmentDetails: data.needsInvestment ? data.investmentDetails : null,
        teamMembers: data.teamMembers,
        lookingFor: data.lookingFor,
        tags: data.tags,
        language: data.language,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
