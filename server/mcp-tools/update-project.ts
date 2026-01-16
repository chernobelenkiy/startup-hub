import { z } from "zod";
import { db as prisma } from "@/lib/db";
import { requireAuth, mcpSuccess, mcpError, type McpResponse } from "./mcp-helpers";
import type { SupportedLanguage } from "@/lib/translations/project-translations";

export const updateProjectSchema = {
  slug: z.string().describe("Project slug to update"),
  title: z.string().min(1).max(100).optional().describe("Project title"),
  shortDescription: z.string().min(1).max(200).optional().describe("Short description"),
  pitch: z.string().optional().describe("General pitch describing the project's vision, problem being solved, solution, and value proposition. This is the main narrative about what the project does and why it matters."),
  features: z.string().max(10000).optional().nullable().describe("Key features and functionality of the project (max 10000 chars)"),
  status: z.enum(["IDEA", "MVP", "BETA", "LAUNCHED", "PAUSED"]).optional().describe("Project status"),
  tags: z.array(z.string()).optional().describe("Project tags"),
  lookingFor: z.array(z.string()).optional().describe("Roles you're looking for"),
  websiteUrl: z.string().url().optional().nullable().describe("Project website URL"),
  traction: z.string().optional().nullable().describe("Traction and progress metrics: user growth, revenue, partnerships, milestones achieved, beta users, waitlist size, or any other evidence of market validation"),
  needsInvestment: z.boolean().optional().describe("Whether project needs investment"),
  investmentDetails: z.string().optional().nullable().describe("Investment details"),
  language: z.enum(["en", "ru"]).optional().describe("Content language to update. If not specified, updates the project's current language.")
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
      where: { slug: input.slug },
      include: { translations: true }
    });

    if (!project) {
      return mcpError("Project not found");
    }

    if (project.ownerId !== auth.userId) {
      return mcpError("You don't have permission to update this project");
    }

    const { slug, language: inputLanguage, ...updateData } = input;

    // Determine target language - default to project's current language or "ru"
    const targetLanguage: SupportedLanguage = inputLanguage || (project.language as SupportedLanguage) || "ru";

    // Build non-translatable update data
    const projectUpdateData: Record<string, unknown> = {};
    if (updateData.status !== undefined) projectUpdateData.status = updateData.status;
    if (updateData.tags !== undefined) projectUpdateData.tags = updateData.tags;
    if (updateData.lookingFor !== undefined) projectUpdateData.lookingFor = updateData.lookingFor;
    if (updateData.websiteUrl !== undefined) projectUpdateData.websiteUrl = updateData.websiteUrl;
    if (updateData.needsInvestment !== undefined) projectUpdateData.needsInvestment = updateData.needsInvestment;

    // Build translatable fields update
    const translationUpdateData: Record<string, unknown> = {};
    if (updateData.title !== undefined) {
      translationUpdateData.title = updateData.title;
      projectUpdateData.title = updateData.title;
    }
    if (updateData.shortDescription !== undefined) {
      translationUpdateData.shortDescription = updateData.shortDescription;
      projectUpdateData.shortDescription = updateData.shortDescription;
    }
    if (updateData.pitch !== undefined) {
      translationUpdateData.pitch = updateData.pitch;
      projectUpdateData.pitch = updateData.pitch;
    }
    if (updateData.features !== undefined) {
      translationUpdateData.features = updateData.features;
    }
    if (updateData.traction !== undefined) {
      translationUpdateData.traction = updateData.traction;
      projectUpdateData.traction = updateData.traction;
    }
    if (updateData.investmentDetails !== undefined) {
      const investmentDetails = updateData.needsInvestment !== false ? updateData.investmentDetails : null;
      translationUpdateData.investmentDetails = investmentDetails;
      projectUpdateData.investmentDetails = investmentDetails;
    }

    // Update project
    await prisma.project.update({
      where: { slug },
      data: projectUpdateData,
    });

    // Upsert translation if any translatable fields were provided
    if (Object.keys(translationUpdateData).length > 0) {
      const existingTranslation = project.translations.find(t => t.language === targetLanguage);

      if (existingTranslation) {
        await prisma.projectTranslation.update({
          where: { id: existingTranslation.id },
          data: translationUpdateData
        });
      } else {
        // Create new translation
        await prisma.projectTranslation.create({
          data: {
            projectId: project.id,
            language: targetLanguage,
            title: (updateData.title || project.title || ""),
            shortDescription: (updateData.shortDescription || project.shortDescription || ""),
            pitch: (updateData.pitch || project.pitch || ""),
            features: updateData.features ?? null,
            traction: updateData.traction ?? project.traction,
            investmentDetails: updateData.investmentDetails ?? project.investmentDetails,
          }
        });
      }
    }

    // Fetch updated project with translations
    const finalProject = await prisma.project.findUnique({
      where: { slug },
      include: { translations: true }
    });

    return mcpSuccess({
      message: "Project updated successfully",
      project: {
        id: finalProject!.id,
        slug: finalProject!.slug,
        title: finalProject!.title,
        status: finalProject!.status,
        updatedLanguage: targetLanguage,
        translations: finalProject!.translations.map(t => ({
          language: t.language,
          title: t.title
        }))
      }
    });
  } catch (error) {
    console.error("[MCP] update_project error:", error);
    return mcpError("Failed to update project");
  }
}
