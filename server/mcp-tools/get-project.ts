import { z } from "zod";
import { db as prisma } from "@/lib/db";
import { mcpSuccess, mcpError, type McpResponse } from "./mcp-helpers";

export const getProjectSchema = {
  slug: z.string().describe("Project slug or ID")
};

type GetProjectInput = z.infer<z.ZodObject<typeof getProjectSchema>>;

interface ProjectOwner {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  title: string | null;
  company: string | null;
  socialLinks: {
    linkedin?: string;
    github?: string;
    telegram?: string;
    instagram?: string;
    website?: string;
  } | null;
  openToContact: boolean;
}

interface ProjectResponse {
  project: {
    id: string;
    slug: string;
    screenshotUrl: string | null;
    websiteUrl: string | null;
    status: string;
    estimatedLaunch: Date | null;
    needsInvestment: boolean;
    teamMembers: unknown;
    lookingFor: string[];
    tags: string[];
    likesCount: number;
    visible: boolean;
    createdAt: Date;
    updatedAt: Date;
    owner: ProjectOwner;
    translations: Record<string, {
      title: string;
      shortDescription: string;
      pitch: string;
      features: string | null;
      traction: string | null;
      investmentDetails: string | null;
    }>;
    availableLanguages: string[];
    title: string | null;
    shortDescription: string | null;
    pitch: string | null;
    traction: string | null;
    investmentDetails: string | null;
    language: string;
  };
}

export async function getProjectHandler(
  input: GetProjectInput,
  userId: string | null
): Promise<McpResponse<ProjectResponse>> {
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
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            title: true,
            company: true,
            socialLinks: true,
            openToContact: true,
          }
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

    // Cast socialLinks from Prisma Json type
    const ownerSocialLinks = project.owner.socialLinks as ProjectOwner['socialLinks'];

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
        visible: project.visible,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        // Owner with enhanced profile data including social links
        owner: {
          id: project.owner.id,
          name: project.owner.name,
          image: project.owner.image,
          bio: project.owner.bio,
          title: project.owner.title,
          company: project.owner.company,
          socialLinks: ownerSocialLinks,
          openToContact: project.owner.openToContact,
        },
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
