import { z } from "zod";
import { db as prisma } from "@/lib/db";
import { requireAuth, mcpSuccess, mcpError, type McpResponse } from "./mcp-helpers";

export const deleteProjectSchema = {
  slug: z.string().describe("Project slug to delete")
};

type DeleteProjectInput = z.infer<z.ZodObject<typeof deleteProjectSchema>>;

export async function deleteProjectHandler(
  input: DeleteProjectInput,
  userId: string | null
): Promise<McpResponse> {
  const auth = requireAuth(userId);
  if (!auth.authenticated) return auth.response;

  try {
    const project = await prisma.project.findUnique({
      where: { slug: input.slug }
    });

    if (!project) {
      return mcpError("Project not found");
    }

    if (project.ownerId !== auth.userId) {
      return mcpError("You don't have permission to delete this project");
    }

    await prisma.project.delete({
      where: { slug: input.slug }
    });

    return mcpSuccess({
      message: "Project deleted successfully",
      deletedSlug: input.slug
    });
  } catch (error) {
    console.error("[MCP] delete_project error:", error);
    return mcpError("Failed to delete project");
  }
}
