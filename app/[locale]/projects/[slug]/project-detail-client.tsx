"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectDetail } from "@/components/project/project-detail";
import { EditProjectModal } from "@/components/project/edit-project-modal";
import type { ProjectStatus, ProjectTranslation } from "@/lib/db";
import type { TeamMember } from "@/lib/validations/project";

interface SerializedTranslation {
  id: string;
  projectId: string;
  language: string;
  title: string;
  shortDescription: string;
  pitch: string;
  traction: string | null;
  investmentDetails: string | null;
}

interface ProjectDetailClientProps {
  project: {
    id: string;
    slug: string;
    title: string | null;
    shortDescription: string | null;
    pitch: string | null;
    screenshotUrl: string | null;
    websiteUrl: string | null;
    status: ProjectStatus;
    estimatedLaunch: string | null;
    traction: string | null;
    needsInvestment: boolean;
    investmentDetails: string | null;
    teamMembers: TeamMember[];
    lookingFor: string[];
    tags: string[];
    likesCount: number;
    isLiked?: boolean;
    language: string;
    createdAt: string;
    updatedAt: string;
    owner: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    };
    translations?: SerializedTranslation[];
  };
  isOwner: boolean;
}

export function ProjectDetailClient({
  project,
  isOwner,
}: ProjectDetailClientProps) {
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    router.refresh();
  };

  // Cast translations to the expected type for ProjectDetail
  const projectWithTranslations = {
    ...project,
    translations: project.translations as unknown as import("@/lib/db").ProjectTranslation[] | undefined,
  };

  return (
    <>
      <ProjectDetail
        project={projectWithTranslations}
        isOwner={isOwner}
        onEdit={() => setEditModalOpen(true)}
      />

      {isOwner && (
        <EditProjectModal
          project={{
            id: project.id,
            slug: project.slug,
            title: project.title || "",
            shortDescription: project.shortDescription || "",
            status: project.status,
            likesCount: project.likesCount,
            tags: project.tags,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          }}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
