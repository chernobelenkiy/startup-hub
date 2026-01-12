import { createMcpHandler } from "@vercel/mcp-adapter";
import {
  extractUserIdFromToken,
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
      async (params) => {
        const userId = await extractUserIdFromToken();
        return listProjectsHandler(params, userId);
      }
    );

    // Get Project - Public
    server.tool(
      "get_project",
      "Get detailed information about a specific project by its slug or ID.",
      getProjectSchema,
      async (params) => {
        const userId = await extractUserIdFromToken();
        return getProjectHandler(params, userId);
      }
    );

    // Create Project - Requires Auth
    server.tool(
      "create_project",
      "Create a new project. Requires authentication with an API token that has 'create' permission.",
      createProjectSchema,
      async (params) => {
        const userId = await extractUserIdFromToken();
        return createProjectHandler(params, userId);
      }
    );

    // Update Project - Requires Auth + Ownership
    server.tool(
      "update_project",
      "Update an existing project. Requires authentication and ownership of the project.",
      updateProjectSchema,
      async (params) => {
        const userId = await extractUserIdFromToken();
        return updateProjectHandler(params, userId);
      }
    );

    // Delete Project - Requires Auth + Ownership
    server.tool(
      "delete_project",
      "Delete a project. Requires authentication and ownership of the project.",
      deleteProjectSchema,
      async (params) => {
        const userId = await extractUserIdFromToken();
        return deleteProjectHandler(params, userId);
      }
    );
  },
  {
    capabilities: {
      tools: {}
    }
  },
  {
    basePath: "/api/v1/mcp",
    verboseLogs: process.env.NODE_ENV === "development"
  }
);

export { handler as GET, handler as POST };
