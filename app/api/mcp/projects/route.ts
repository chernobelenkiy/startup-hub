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
  apiValidationError,
  apiInternalError,
  logApiRequest,
  logApiError,
} from "@/lib/api-response";
import { createProjectSchema } from "@/lib/validations/project";
import { generateSlug } from "@/lib/utils";

/**
 * Pagination configuration
 */
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

/**
 * GET /api/mcp/projects
 * List all projects for the authenticated user with cursor-based pagination
 *
 * Query params:
 * - cursor: Project ID to start after (optional)
 * - limit: Number of results (default: 20, max: 100)
 *
 * Required permission: read
 */
export async function GET(request: NextRequest) {
  try {
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

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limitParam = searchParams.get("limit");

    // Validate and parse limit
    let limit = DEFAULT_PAGE_LIMIT;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return apiValidationError(
          "Invalid limit parameter. Must be a positive integer.",
          { limit: ["Must be a positive integer between 1 and 100"] },
          { rateLimit }
        );
      }
      limit = Math.min(parsedLimit, MAX_PAGE_LIMIT);
    }

    // Log the request
    logApiRequest("GET", "/api/mcp/projects", user.tokenId, user.userId);

    // Build query with cursor-based pagination
    const queryOptions: {
      where: { ownerId: string };
      select: Record<string, boolean>;
      orderBy: { updatedAt: "desc" };
      take: number;
      skip?: number;
      cursor?: { id: string };
    } = {
      where: {
        ownerId: user.userId,
      },
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
      orderBy: {
        updatedAt: "desc",
      },
      // Fetch one extra to check if there are more results
      take: limit + 1,
    };

    // Add cursor if provided
    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // Skip the cursor item itself
    }

    // Fetch projects
    const projects = await db.project.findMany(queryOptions);

    // Check if there are more results
    const hasMore = projects.length > limit;
    const results = hasMore ? projects.slice(0, limit) : projects;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    // Get total count for metadata
    const total = await db.project.count({
      where: { ownerId: user.userId },
    });

    return apiSuccess(
      {
        projects: results,
        pagination: {
          total,
          limit,
          hasMore,
          nextCursor,
        },
      },
      200,
      { rateLimit }
    );
  } catch (error) {
    logApiError("GET", "/api/mcp/projects", error, MCP_ERROR_CODES.INTERNAL_ERROR);
    return apiInternalError("Failed to fetch projects");
  }
}

/**
 * POST /api/mcp/projects
 * Create a new project
 *
 * Required permission: create
 */
export async function POST(request: NextRequest) {
  try {
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
    if (!hasPermission(user.permissions, "create")) {
      return apiError(
        "Token does not have 'create' permission",
        MCP_ERROR_CODES.FORBIDDEN,
        undefined,
        { rateLimit }
      );
    }

    // Log the request
    logApiRequest("POST", "/api/mcp/projects", user.tokenId, user.userId);

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
    const validationResult = createProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return apiValidationError(
        "Validation failed",
        { fields: validationResult.error.flatten().fieldErrors },
        { rateLimit }
      );
    }

    const data = validationResult.data;

    // Generate unique slug
    const slug = generateSlug(data.title);

    // Create project
    const project = await db.project.create({
      data: {
        slug,
        ownerId: user.userId,
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

    return apiSuccess({ project }, 201, { rateLimit });
  } catch (error) {
    logApiError("POST", "/api/mcp/projects", error, MCP_ERROR_CODES.INTERNAL_ERROR);
    return apiInternalError("Failed to create project");
  }
}
