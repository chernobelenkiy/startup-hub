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
        },
        translations: true
      }
    });

    if (!project) {
      return mcpError("Project not found");
    }

    // Format translations as a more usable object
    const translationsByLanguage: Record<string, {
      title: string;
      shortDescription: string;
      pitch: string;
      features: string | null;
      traction: string | null;
      investmentDetails: string | null;
    }> = {};

    for (const translation of project.translations) {
      translationsByLanguage[translation.language] = {
        title: translation.title,
        shortDescription: translation.shortDescription,
        pitch: translation.pitch,
        features: translation.features,
        traction: translation.traction,
        investmentDetails: translation.investmentDetails,
      };
    }

    return mcpSuccess({
      project: {
        id: project.id,
        slug: project.slug,
        // Non-translatable fields
        screenshotUrl: project.screenshotUrl,
        websiteUrl: project.websiteUrl,
        status: project.status,
        estimatedLaunch: project.estimatedLaunch,
        needsInvestment: project.needsInvestment,
        teamMembers: project.teamMembers,
        lookingFor: project.lookingFor,
        tags: project.tags,
        likesCount: project.likesCount,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        owner: project.owner,
        // Translations - all available languages
        translations: translationsByLanguage,
        availableLanguages: project.translations.map(t => t.language),
        // Legacy fields for backward compatibility (from primary language)
        title: project.title,
        shortDescription: project.shortDescription,
        pitch: project.pitch,
        traction: project.traction,
        investmentDetails: project.investmentDetails,
        language: project.language,
      }
    });
  } catch (error) {
    console.error("[MCP] get_project error:", error);
    return mcpError("Failed to get project");
  }
}
