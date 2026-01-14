import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { ProjectsPageClient } from "./projects-page-client";
import { resolveProjectTranslation, type ProjectWithTranslations } from "@/lib/translations/project-translations";

export default async function ProjectsPage() {
  const session = await auth();
  const t = await getTranslations("project");
  const locale = await getLocale();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Fetch user's projects with translations
  const projects = await db.project.findMany({
    where: {
      ownerId: session.user.id,
    },
    include: {
      translations: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Serialize dates and resolve translations for client component
  const serializedProjects = projects.map((project) => {
    const resolved = resolveProjectTranslation(
      project as unknown as ProjectWithTranslations,
      locale
    );
    return {
      id: project.id,
      slug: project.slug,
      title: resolved.title,
      shortDescription: resolved.shortDescription,
      status: project.status,
      likesCount: project.likesCount,
      tags: project.tags,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("myProjects")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
      </div>
      <ProjectsPageClient initialProjects={serializedProjects} />
    </div>
  );
}
