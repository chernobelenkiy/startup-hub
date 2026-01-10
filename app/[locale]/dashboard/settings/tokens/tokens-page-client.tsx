"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Key, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  TokenCreatedBanner,
  TokenTable,
  GenerateTokenForm,
  RevokeTokenDialog,
  DeveloperQuickstart,
  type TokenData,
} from "@/components/tokens";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MAX_TOKENS = 10;

interface TokensPageClientProps {
  initialTokens: TokenData[];
  initialActiveCount: number;
}

/**
 * Client component for API Token management page
 * Handles token generation, display, and revocation
 */
export function TokensPageClient({
  initialTokens,
  initialActiveCount,
}: TokensPageClientProps) {
  const t = useTranslations("apiTokens");

  // State
  const [tokens, setTokens] = useState<TokenData[]>(initialTokens);
  const [activeCount, setActiveCount] = useState(initialActiveCount);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<TokenData | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  /**
   * Generate a new API token
   */
  const handleGenerateToken = useCallback(
    async (
      name: string,
      permissions: ("read" | "create" | "update" | "delete")[],
      expiresAt?: Date
    ) => {
      setIsGenerating(true);
      try {
        const response = await fetch("/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            permissions,
            expiresAt: expiresAt?.toISOString() ?? null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create token");
        }

        // Add new token to list
        const createdToken: TokenData = {
          id: data.token.id,
          name: data.token.name,
          permissions: data.token.permissions,
          status: "active",
          createdAt: data.token.createdAt,
          expiresAt: data.token.expiresAt,
          lastUsedAt: null,
        };

        setTokens((prev) => [createdToken, ...prev]);
        setActiveCount((prev) => prev + 1);
        setNewToken(data.token.plainToken);
        setShowGenerateDialog(false);
        toast.success(t("tokenCreated"));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create token";
        toast.error(message);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [t]
  );

  /**
   * Revoke an existing token
   */
  const handleRevokeToken = useCallback(
    async (tokenId: string) => {
      setIsRevoking(true);
      try {
        const response = await fetch(`/api/tokens/${tokenId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to revoke token");
        }

        // Update token status in list
        setTokens((prev) =>
          prev.map((token) =>
            token.id === tokenId ? { ...token, status: "revoked" as const } : token
          )
        );
        setActiveCount((prev) => Math.max(0, prev - 1));
        toast.success(t("tokenRevoked"));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to revoke token";
        toast.error(message);
        throw error;
      } finally {
        setIsRevoking(false);
      }
    },
    [t]
  );

  /**
   * Dismiss the new token banner
   */
  const handleDismissNewToken = useCallback(() => {
    setNewToken(null);
  }, []);

  /**
   * Open revoke confirmation dialog
   */
  const handleOpenRevokeDialog = useCallback((token: TokenData) => {
    setTokenToRevoke(token);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Key className="size-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>

        {/* Generate token button */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button disabled={activeCount >= MAX_TOKENS}>
              <Plus className="size-4" />
              {t("createToken")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("createToken")}</DialogTitle>
              <DialogDescription>
                {t("createTokenDescription") ||
                  "Create a new API token to access the Startup Hub API."}
              </DialogDescription>
            </DialogHeader>
            <GenerateTokenForm
              onGenerate={handleGenerateToken}
              isLoading={isGenerating}
              tokenCount={activeCount}
              maxTokens={MAX_TOKENS}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* New token banner (shown only once after creation) */}
      {newToken && (
        <TokenCreatedBanner token={newToken} onDismiss={handleDismissNewToken} />
      )}

      {/* Token count info */}
      <div className="text-sm text-muted-foreground">
        {t("tokenCount", { current: activeCount, max: MAX_TOKENS }) ||
          `${activeCount} of ${MAX_TOKENS} active tokens`}
      </div>

      {/* Token table */}
      <TokenTable
        tokens={tokens}
        onRevoke={handleOpenRevokeDialog}
        isLoading={false}
      />

      {/* Developer quickstart section */}
      <div className="pt-6">
        <h2 className="text-lg font-semibold mb-4">
          {t("quickstart") || "Developer Quickstart"}
        </h2>
        <DeveloperQuickstart />
      </div>

      {/* Revoke confirmation dialog */}
      <RevokeTokenDialog
        token={tokenToRevoke}
        open={tokenToRevoke !== null}
        onOpenChange={(open) => !open && setTokenToRevoke(null)}
        onConfirm={handleRevokeToken}
      />
    </div>
  );
}
