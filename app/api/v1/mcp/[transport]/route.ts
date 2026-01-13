import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { db as prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  listProjectsSchema,
  listProjectsHandler,
  getProjectSchema,
  getProjectHandler,
  createProjectSchema,
  createProjectHandler,
  updateProjectSchema,
  updateProjectHandler,
  deleteProjectSchema,
  deleteProjectHandler,
} from "@/server/mcp-tools";

// Create the MCP handler
const handler = createMcpHandler(
  (server) => {
    // List Projects - Public (no auth required)
    server.tool(
      "list_projects",
      "List projects with optional filtering by status, tags, or search query. Returns paginated results.",
      listProjectsSchema,
      async (params, extra) => {
        const userId = extra.authInfo?.extra?.userId as string | undefined;
        return listProjectsHandler(params, userId || null);
      }
    );

    // Get Project - Public
    server.tool(
      "get_project",
      "Get detailed information about a specific project by its slug or ID.",
      getProjectSchema,
      async (params, extra) => {
        const userId = extra.authInfo?.extra?.userId as string | undefined;
        return getProjectHandler(params, userId || null);
      }
    );

    // Create Project - Requires Auth
    server.tool(
      "create_project",
      "Create a new project. Requires authentication with an API token that has 'create' permission.",
      createProjectSchema,
      async (params, extra) => {
        const userId = extra.authInfo?.extra?.userId as string | undefined;
        return createProjectHandler(params, userId || null);
      }
    );

    // Update Project - Requires Auth + Ownership
    server.tool(
      "update_project",
      "Update an existing project. Requires authentication and ownership of the project.",
      updateProjectSchema,
      async (params, extra) => {
        const userId = extra.authInfo?.extra?.userId as string | undefined;
        return updateProjectHandler(params, userId || null);
      }
    );

    // Delete Project - Requires Auth + Ownership
    server.tool(
      "delete_project",
      "Delete a project. Requires authentication and ownership of the project.",
      deleteProjectSchema,
      async (params, extra) => {
        const userId = extra.authInfo?.extra?.userId as string | undefined;
        return deleteProjectHandler(params, userId || null);
      }
    );
  },
  {},
  {
    basePath: "/api/v1/mcp",
    verboseLogs: process.env.NODE_ENV === "development"
  }
);

// Token verification function
const verifyToken = async (
  req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;

  try {
    // Find all non-revoked, non-expired tokens
    const tokens = await prisma.aPIToken.findMany({
      where: {
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    // Compare token with stored hashes
    for (const record of tokens) {
      const isValid = await bcrypt.compare(bearerToken, record.tokenHash);
      if (isValid) {
        // Update lastUsedAt (fire-and-forget)
        prisma.aPIToken.update({
          where: { id: record.id },
          data: { lastUsedAt: new Date() }
        }).catch(() => {});

        return {
          token: bearerToken,
          scopes: record.permissions,
          clientId: record.userId,
          extra: {
            userId: record.userId,
            tokenId: record.id,
          },
        };
      }
    }

    return undefined;
  } catch (error) {
    console.error("[MCP Auth] Error:", error);
    return undefined;
  }
};

// Wrap handler with auth (not required, so public endpoints still work)
const authHandler = withMcpAuth(handler, verifyToken, {
  required: false
});

export { authHandler as GET, authHandler as POST };
