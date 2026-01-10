"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TokenData } from "./token-table";

interface RevokeTokenDialogProps {
  token: TokenData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tokenId: string) => Promise<void>;
}

/**
 * Confirmation dialog before revoking an API token
 */
export function RevokeTokenDialog({
  token,
  open,
  onOpenChange,
  onConfirm,
}: RevokeTokenDialogProps) {
  const t = useTranslations("apiTokens");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      await onConfirm(token.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to revoke token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>{t("revokeTitle") || "Revoke Token"}</DialogTitle>
              <DialogDescription className="mt-1">
                {t("revokeDescription") || "This action cannot be undone."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {token && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              {t("revokeConfirm") || "Are you sure you want to revoke this token?"}
            </p>
            <div className="bg-surface rounded-md p-3 border border-border">
              <p className="font-medium text-sm">{token.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("permissions")}: {token.permissions.join(", ")}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {t("revokeWarning") || "Once revoked, any applications using this token will immediately lose access."}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("revoking") || "Revoking..."}
              </>
            ) : (
              t("revoke")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
