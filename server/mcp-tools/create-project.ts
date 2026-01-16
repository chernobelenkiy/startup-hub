import { z } from "zod";
import { db as prisma } from "@/lib/db";
import { requireAuth, mcpSuccess, mcpError, type McpResponse } from "./mcp-helpers";
import { generateSlug } from "@/lib/utils";
import type { SupportedLanguage } from "@/lib/translations/project-translations";

export const createProjectSchema = {
  title: z.string().min(1).max(100).describe("Project title"),
  shortDescription: z.string().min(1).max(200).describe("Short description (max 200 chars)"),
  pitch: z.string().optional().describe("General pitch describing the project's vision, problem being solved, solution, and value proposition. This is the main narrative about what the project does and why it matters."),
  features: z.string().max(10000).optional().describe("Key features and functionality of the project (max 10000 chars)"),
  status: z.enum(["IDEA", "MVP", "BETA", "LAUNCHED", "PAUSED"]).optional().describe("Project status"),
  tags: z.array(z.string()).optional().describe("Project tags"),
  lookingFor: z.array(z.string()).optional().describe("Roles you're looking for"),
  websiteUrl: z.string().url().optional().describe("Project website URL"),
  traction: z.string().optional().describe("Traction and progress metrics: user growth, revenue, partnerships, milestones achieved, beta users, waitlist size, or any other evidence of market validation"),
  needsInvestment: z.boolean().optional().describe("Whether project needs investment"),
  investmentDetails: z.string().optional().describe("Investment details if needed"),
  language: z.enum(["en", "ru"]).optional().describe("Content language (default: ru). Specifies which language the provided content is in.")
};

type CreateProjectInput = z.infer<z.ZodObject<typeof createProjectSchema>>;

export async function createProjectHandler(
  input: CreateProjectInput,
  userId: string | null
): Promise<McpResponse> {
  const auth = requireAuth(userId);
  if (!auth.authenticated) return auth.response;

  try {
    const slug = await generateSlug(input.title);

    // Default to Russian as per plan
    const language: SupportedLanguage = input.language || "ru";

    const project = await prisma.project.create({
      data: {
        slug,
        // Legacy fields (for backward compatibility)
        title: input.title,
        shortDescription: input.shortDescription,
        pitch: input.pitch || "",
        traction: input.traction,
        investmentDetails: input.investmentDetails,
        language,
        // Non-translatable fields
        status: input.status || "IDEA",
        tags: input.tags || [],
        lookingFor: input.lookingFor || [],
        websiteUrl: input.websiteUrl,
        needsInvestment: input.needsInvestment || false,
        ownerId: auth.userId,
        // Create translation record
        translations: {
          create: {
            language,
            title: input.title,
            shortDescription: input.shortDescription,
            pitch: input.pitch || "",
            features: input.features,
            traction: input.traction,
            investmentDetails: input.needsInvestment ? input.investmentDetails : null,
          }
        }
      },
      include: {
        translations: true
      }
    });

    return mcpSuccess({
      message: "Project created successfully",
      project: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        status: project.status,
        language,
        translations: project.translations.map(t => ({
          language: t.language,
          title: t.title
        }))
      }
    });
  } catch (error) {
    console.error("[MCP] create_project error:", error);
    return mcpError("Failed to create project");
  }
}
