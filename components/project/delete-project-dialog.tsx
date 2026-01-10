"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import type { ProjectListItem } from "@/components/dashboard/project-list";

interface DeleteProjectDialogProps {
  project: ProjectListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteProjectDialogProps) {
  const t = useTranslations("project");
  const tCommon = useTranslations("common");

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <DialogTitle>{t("deleteProject")}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{project.title}</span>?
            This action cannot be undone and all associated data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="size-4 mr-2 animate-spin" />}
            {tCommon("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
