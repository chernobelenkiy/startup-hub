import { z } from "zod";
import { db as prisma } from "@/lib/db";
import { requireAuth, mcpSuccess, mcpError, type McpResponse } from "./mcp-helpers";

export const updateProjectSchema = {
  slug: z.string().describe("Project slug to update"),
  title: z.string().min(1).max(100).optional().describe("Project title"),
  shortDescription: z.string().min(1).max(200).optional().describe("Short description"),
  pitch: z.string().optional().describe("Full project pitch"),
  status: z.enum(["IDEA", "MVP", "BETA", "LAUNCHED", "PAUSED"]).optional().describe("Project status"),
  tags: z.array(z.string()).optional().describe("Project tags"),
  lookingFor: z.array(z.string()).optional().describe("Roles you're looking for"),
  websiteUrl: z.string().url().optional().nullable().describe("Project website URL"),
  needsInvestment: z.boolean().optional().describe("Whether project needs investment"),
  investmentDetails: z.string().optional().nullable().describe("Investment details")
};

type UpdateProjectInput = z.infer<z.ZodObject<typeof updateProjectSchema>>;

export async function updateProjectHandler(
  input: UpdateProjectInput,
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
      return mcpError("You don't have permission to update this project");
    }

    const { slug, ...updateData } = input;
    
    const updated = await prisma.project.update({
      where: { slug },
      data: updateData
    });

    return mcpSuccess({
      message: "Project updated successfully",
      project: {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        status: updated.status
      }
    });
  } catch (error) {
    console.error("[MCP] update_project error:", error);
    return mcpError("Failed to update project");
  }
}
