import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ProjectDetailClient } from "./project-detail-client";
import { resolveProjectTranslation, type ProjectWithTranslations } from "@/lib/translations/project-translations";

interface ProjectPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// ISR - Revalidate every 60 seconds
export const revalidate = 60;

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug, locale } = await params;

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      translations: true,
    },
  });

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  // Resolve translation for metadata based on locale
  const resolved = resolveProjectTranslation(
    project as unknown as ProjectWithTranslations,
    locale
  );

  return {
    title: resolved.title,
    description: resolved.shortDescription,
    openGraph: {
      title: resolved.title,
      description: resolved.shortDescription,
      images: project.screenshotUrl ? [project.screenshotUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: resolved.title,
      description: resolved.shortDescription,
      images: project.screenshotUrl ? [project.screenshotUrl] : [],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      translations: true,
      // Include likes for the current user to determine isLiked
      likes: userId
        ? {
            where: { userId },
            select: { userId: true },
          }
        : undefined,
    },
  });

  if (!project) {
    notFound();
  }

  const isOwner = userId === project.ownerId;
  const isLiked = Boolean(userId && project.likes?.length);

  // Serialize for client component - include translations
  const serializedProject = {
    id: project.id,
    slug: project.slug,
    title: project.title,
    shortDescription: project.shortDescription,
    pitch: project.pitch,
    screenshotUrl: project.screenshotUrl,
    websiteUrl: project.websiteUrl,
    status: project.status,
    estimatedLaunch: project.estimatedLaunch?.toISOString() || null,
    traction: project.traction,
    needsInvestment: project.needsInvestment,
    investmentDetails: project.investmentDetails,
    teamMembers: project.teamMembers as Array<{ name: string; role: string; avatarUrl?: string | null }>,
    lookingFor: project.lookingFor,
    tags: project.tags,
    likesCount: project.likesCount,
    isLiked,
    language: project.language,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    owner: project.owner,
    translations: project.translations.map((t) => ({
      id: t.id,
      projectId: t.projectId,
      language: t.language,
      title: t.title,
      shortDescription: t.shortDescription,
      pitch: t.pitch,
      traction: t.traction,
      investmentDetails: t.investmentDetails,
    })),
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ProjectDetailClient project={serializedProject} isOwner={isOwner} />
    </div>
  );
}
