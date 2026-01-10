"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectDetail } from "@/components/project/project-detail";
import { EditProjectModal } from "@/components/project/edit-project-modal";
import type { ProjectStatus } from "@/lib/db";
import type { TeamMember } from "@/lib/validations/project";

interface ProjectDetailClientProps {
  project: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    pitch: string;
    screenshotUrl: string | null;
    websiteUrl: string | null;
    status: ProjectStatus;
    estimatedLaunch: string | null;
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

  return (
    <>
      <ProjectDetail
        project={project}
        isOwner={isOwner}
        onEdit={() => setEditModalOpen(true)}
      />

      {isOwner && (
        <EditProjectModal
          project={{
            id: project.id,
            slug: project.slug,
            title: project.title,
            shortDescription: project.shortDescription,
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
