import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  authenticateMCPRequest,
  hasPermission,
  MCP_ERROR_CODES,
} from "@/lib/mcp-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  apiSuccess,
  apiError,
  apiRateLimited,
  apiNotFound,
  apiValidationError,
  apiInternalError,
  logApiRequest,
  logApiError,
} from "@/lib/api-response";
import { updateProjectSchema } from "@/lib/validations/project";

/**
 * Route parameters for project operations
 */
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/mcp/projects/[id]
 * Get a specific project by ID
 *
 * Required permission: read
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Authenticate the request
    const authResult = await authenticateMCPRequest(request);

    if (!authResult.success) {
      return apiError(authResult.error, authResult.code);
    }

    const { user } = authResult;

    // Check rate limit
    const rateLimit = checkRateLimit(user.tokenId);

    if (!rateLimit.allowed) {
      return apiRateLimited(rateLimit);
    }

    // Check permission
    if (!hasPermission(user.permissions, "read")) {
      return apiError(
        "Token does not have 'read' permission",
        MCP_ERROR_CODES.FORBIDDEN,
        undefined,
        { rateLimit }
      );
    }

    // Log the request
    logApiRequest("GET", `/api/mcp/projects/${id}`, user.tokenId, user.userId);

    // Fetch the project
    const project = await db.project.findUnique({
      where: { id },
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
        teamMembers: true,
        lookingFor: true,
        tags: true,
        likesCount: true,
        language: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return apiNotFound("Project not found", { rateLimit });
    }

    // Ownership check - user can only access their own projects
    if (project.ownerId !== user.userId) {
      return apiNotFound("Project not found", { rateLimit });
    }

    // Remove ownerId from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ownerId: _ownerId, ...projectData } = project;

    return apiSuccess({ project: projectData }, 200, { rateLimit });
  } catch (error) {
    logApiError("GET", "/api/mcp/projects/[id]", error, MCP_ERROR_CODES.INTERNAL_ERROR);
    return apiInternalError("Failed to fetch project");
  }
}

/**
 * PUT /api/mcp/projects/[id]
 * Update a project
 *
 * Required permission: update
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Authenticate the request
    const authResult = await authenticateMCPRequest(request);

    if (!authResult.success) {
      return apiError(authResult.error, authResult.code);
    }

    const { user } = authResult;

    // Check rate limit
    const rateLimit = checkRateLimit(user.tokenId);

    if (!rateLimit.allowed) {
      return apiRateLimited(rateLimit);
    }

    // Check permission
    if (!hasPermission(user.permissions, "update")) {
      return apiError(
        "Token does not have 'update' permission",
        MCP_ERROR_CODES.FORBIDDEN,
        undefined,
        { rateLimit }
      );
    }

    // Log the request
    logApiRequest("PUT", `/api/mcp/projects/${id}`, user.tokenId, user.userId);

    // Check if project exists and belongs to user
    const existingProject = await db.project.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!existingProject) {
      return apiNotFound("Project not found", { rateLimit });
    }

    // Ownership check
    if (existingProject.ownerId !== user.userId) {
      return apiNotFound("Project not found", { rateLimit });
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiValidationError(
        "Invalid JSON body",
        undefined,
        { rateLimit }
      );
    }

    // Validate request body
    const validationResult = updateProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return apiValidationError(
        "Validation failed",
        { fields: validationResult.error.flatten().fieldErrors },
        { rateLimit }
      );
    }

    const data = validationResult.data;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.pitch !== undefined) updateData.pitch = data.pitch;
    if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl || null;
    if (data.screenshotUrl !== undefined) updateData.screenshotUrl = data.screenshotUrl || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.estimatedLaunch !== undefined) updateData.estimatedLaunch = data.estimatedLaunch || null;
    if (data.needsInvestment !== undefined) {
      updateData.needsInvestment = data.needsInvestment;
      // Clear investment details if not needed
      if (!data.needsInvestment) {
        updateData.investmentDetails = null;
      }
    }
    if (data.investmentDetails !== undefined) updateData.investmentDetails = data.investmentDetails;
    if (data.teamMembers !== undefined) updateData.teamMembers = data.teamMembers;
    if (data.lookingFor !== undefined) updateData.lookingFor = data.lookingFor;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.language !== undefined) updateData.language = data.language;

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
        teamMembers: true,
        lookingFor: true,
        tags: true,
        likesCount: true,
        language: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess({ project }, 200, { rateLimit });
  } catch (error) {
    logApiError("PUT", "/api/mcp/projects/[id]", error, MCP_ERROR_CODES.INTERNAL_ERROR);
    return apiInternalError("Failed to update project");
  }
}

/**
 * DELETE /api/mcp/projects/[id]
 * Delete a project
 *
 * Required permission: delete
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Authenticate the request
    const authResult = await authenticateMCPRequest(request);

    if (!authResult.success) {
      return apiError(authResult.error, authResult.code);
    }

    const { user } = authResult;

    // Check rate limit
    const rateLimit = checkRateLimit(user.tokenId);

    if (!rateLimit.allowed) {
      return apiRateLimited(rateLimit);
    }

    // Check permission
    if (!hasPermission(user.permissions, "delete")) {
      return apiError(
        "Token does not have 'delete' permission",
        MCP_ERROR_CODES.FORBIDDEN,
        undefined,
        { rateLimit }
      );
    }

    // Log the request
    logApiRequest("DELETE", `/api/mcp/projects/${id}`, user.tokenId, user.userId);

    // Check if project exists and belongs to user
    const existingProject = await db.project.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        title: true,
      },
    });

    if (!existingProject) {
      return apiNotFound("Project not found", { rateLimit });
    }

    // Ownership check
    if (existingProject.ownerId !== user.userId) {
      return apiNotFound("Project not found", { rateLimit });
    }

    // Delete the project
    await db.project.delete({
      where: { id },
    });

    return apiSuccess(
      {
        deleted: true,
        project: {
          id: existingProject.id,
          title: existingProject.title,
        },
      },
      200,
      { rateLimit }
    );
  } catch (error) {
    logApiError("DELETE", "/api/mcp/projects/[id]", error, MCP_ERROR_CODES.INTERNAL_ERROR);
    return apiInternalError("Failed to delete project");
  }
}
