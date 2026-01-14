"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectForm } from "./project-form";
import type { CreateProjectWithTranslationsInput } from "@/lib/validations/project";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectModalProps) {
  const t = useTranslations("project");
  const tErrors = useTranslations("errors");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateProjectWithTranslationsInput & { screenshotUrl?: string | null }) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      toast.success(t("projectCreated"));
      onSuccess();
    } catch (error) {
      console.error("Create project error:", error);
      toast.error(tErrors("serverError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("createProject")}</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new project.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel={t("createProject")}
        />
      </DialogContent>
    </Dialog>
  );
}
