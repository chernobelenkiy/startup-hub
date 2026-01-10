import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProjectsPageClient } from "./projects-page-client";

export default async function ProjectsPage() {
  const session = await auth();
  const t = await getTranslations("project");

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Fetch user's projects
  const projects = await db.project.findMany({
    where: {
      ownerId: session.user.id,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      status: true,
      likesCount: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Serialize dates for client component
  const serializedProjects = projects.map((project) => ({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }));

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
