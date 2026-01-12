import { z } from "zod";
import { db as prisma } from "@/lib/db";
import { mcpSuccess, mcpError, type McpResponse } from "./mcp-helpers";

export const getProjectSchema = {
  slug: z.string().describe("Project slug or ID")
};

type GetProjectInput = z.infer<z.ZodObject<typeof getProjectSchema>>;

export async function getProjectHandler(
  input: GetProjectInput,
  userId: string | null
): Promise<McpResponse> {
  try {
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { slug: input.slug },
          { id: input.slug }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    if (!project) {
      return mcpError("Project not found");
    }

    return mcpSuccess({ project });
  } catch (error) {
    console.error("[MCP] get_project error:", error);
    return mcpError("Failed to get project");
  }
}
