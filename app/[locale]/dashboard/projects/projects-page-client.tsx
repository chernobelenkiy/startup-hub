"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProjectList, type ProjectListItem } from "@/components/dashboard/project-list";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { EditProjectModal } from "@/components/project/edit-project-modal";
import { DeleteProjectDialog } from "@/components/project/delete-project-dialog";
import { Plus } from "lucide-react";

interface ProjectsPageClientProps {
  initialProjects: ProjectListItem[];
}

export function ProjectsPageClient({ initialProjects }: ProjectsPageClientProps) {
  const router = useRouter();
  const t = useTranslations("project");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectListItem | null>(null);
  const [deleteProject, setDeleteProject] = useState<ProjectListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    setCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    router.refresh();
  };

  const handleEdit = (project: ProjectListItem) => {
    setEditProject(project);
  };

  const handleEditSuccess = () => {
    setEditProject(null);
    router.refresh();
  };

  const handleDelete = (project: ProjectListItem) => {
    setDeleteProject(project);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProject) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${deleteProject.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete project");
      }

      // Remove from local state
      setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id));
      toast.success(t("deleteProject") + " - Success");
      setDeleteProject(null);
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(tErrors("serverError"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={handleCreate}>
          <Plus className="size-4 mr-2" />
          {t("createProject")}
        </Button>
      </div>

      <ProjectList
        projects={projects}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />

      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      {editProject && (
        <EditProjectModal
          project={editProject}
          open={!!editProject}
          onOpenChange={(open) => !open && setEditProject(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      <DeleteProjectDialog
        project={deleteProject}
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
