import { z } from "zod";
import { db as prisma } from "@/lib/db";
import { mcpSuccess, mcpError, type McpResponse } from "./mcp-helpers";
import { getBestTranslation } from "@/lib/translations/project-translations";

export const listProjectsSchema = {
  limit: z.number().min(1).max(100).optional().describe("Number of results (default: 10, max: 100)"),
  cursor: z.string().optional().describe("Pagination cursor"),
  status: z.string().optional().describe("Filter by status: IDEA, MVP, BETA, LAUNCHED, PAUSED"),
  search: z.string().optional().describe("Search query - searches across all language translations"),
  tags: z.string().optional().describe("Filter by tags (comma-separated)"),
  locale: z.enum(["en", "ru"]).optional().describe("Preferred locale for returned content (default: ru). Falls back to available translation if preferred is not available.")
};

type ListProjectsInput = z.infer<z.ZodObject<typeof listProjectsSchema>>;

export async function listProjectsHandler(
  input: ListProjectsInput,
  userId: string | null
): Promise<McpResponse> {
  try {
    const limit = input.limit || 10;
    const { cursor, status, search, tags, locale = "ru" } = input;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    // Search across both legacy fields and translations
    if (search) {
      where.OR = [
        // Search in legacy fields
        { title: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        // Search in translations
        {
          translations: {
            some: {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { shortDescription: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
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
      include: {
        translations: true,
        owner: {
          select: { id: true, name: true }
        }
      }
    });

    const hasMore = projects.length > limit;
    const items = hasMore ? projects.slice(0, -1) : projects;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // Resolve translations for each project
    const resolvedItems = items.map(project => {
      const translation = getBestTranslation(project.translations, locale);

      return {
        id: project.id,
        slug: project.slug,
        title: translation?.title ?? project.title ?? "",
        shortDescription: translation?.shortDescription ?? project.shortDescription ?? "",
        status: project.status,
        tags: project.tags,
        likesCount: project.likesCount,
        needsInvestment: project.needsInvestment,
        createdAt: project.createdAt,
        owner: project.owner,
        language: translation?.language ?? project.language,
        availableLanguages: project.translations.map(t => t.language),
      };
    });

    return mcpSuccess({
      projects: resolvedItems,
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
