import { z } from "zod";
import { db as prisma } from "@/lib/db";
import { mcpSuccess, mcpError, type McpResponse } from "./mcp-helpers";

export const listProjectsSchema = {
  limit: z.number().min(1).max(100).optional().describe("Number of results (default: 10, max: 100)"),
  cursor: z.string().optional().describe("Pagination cursor"),
  status: z.string().optional().describe("Filter by status: IDEA, MVP, BETA, LAUNCHED, PAUSED"),
  search: z.string().optional().describe("Search query"),
  tags: z.string().optional().describe("Filter by tags (comma-separated)")
};

type ListProjectsInput = z.infer<z.ZodObject<typeof listProjectsSchema>>;

export async function listProjectsHandler(
  input: ListProjectsInput,
  userId: string | null
): Promise<McpResponse> {
  try {
    const limit = input.limit || 10;
    const { cursor, status, search, tags } = input;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } }
      ];
    }

    if (tags) {
      where.tags = { hasSome: tags.split(",").map(t => t.trim()) };
    }

    const projects = await prisma.project.findMany({
      where,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        status: true,
        tags: true,
        likesCount: true,
        needsInvestment: true,
        createdAt: true,
        owner: {
          select: { id: true, name: true }
        }
      }
    });

    const hasMore = projects.length > limit;
    const items = hasMore ? projects.slice(0, -1) : projects;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return mcpSuccess({
      projects: items,
      pagination: {
        nextCursor,
        hasMore,
        total: await prisma.project.count({ where })
      }
    });
  } catch (error) {
    console.error("[MCP] list_projects error:", error);
    return mcpError("Failed to list projects");
  }
}
