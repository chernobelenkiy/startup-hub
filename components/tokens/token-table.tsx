"use client";

import { useTranslations } from "next-intl";
import { Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Days threshold for "expiring soon" warning
 */
const EXPIRING_SOON_DAYS = 7;

export interface TokenData {
  id: string;
  name: string;
  permissions: string[];
  status: "active" | "revoked";
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
  expiresAt?: string | Date | null;
}

interface TokenTableProps {
  tokens: TokenData[];
  onRevoke: (token: TokenData) => void;
  isLoading?: boolean;
}

/**
 * Token table displaying all user's API tokens
 * Columns: Name, Status, Created, Last Used, Actions
 */
export function TokenTable({ tokens, onRevoke, isLoading }: TokenTableProps) {
  const t = useTranslations("apiTokens");
  const tPermissions = useTranslations("permissions");

  const formatDate = (date: string | Date | null) => {
    if (!date) return t("never");
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPermissions = (permissions: string[]) => {
    return permissions.map((p) => tPermissions(p as "read" | "create" | "update" | "delete")).join(", ");
  };

  /**
   * Check if a token is expiring soon (within EXPIRING_SOON_DAYS)
   */
  const isExpiringSoon = (expiresAt: string | Date | null | undefined): boolean => {
    if (!expiresAt) return false;
    const expDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= EXPIRING_SOON_DAYS;
  };

  /**
   * Check if a token has expired
   */
  const isExpired = (expiresAt: string | Date | null | undefined): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  /**
   * Format expiration with warning styling
   */
  const formatExpiration = (token: TokenData) => {
    const { expiresAt } = token;

    if (!expiresAt) {
      return <span className="text-muted-foreground">{t("never")}</span>;
    }

    const expired = isExpired(expiresAt);
    const expiringSoon = isExpiringSoon(expiresAt);

    return (
      <span className={cn(
        "inline-flex items-center gap-1",
        expired && "text-destructive",
        expiringSoon && !expired && "text-amber-500"
      )} suppressHydrationWarning>
        {(expired || expiringSoon) && (
          <AlertTriangle className="size-3" />
        )}
        {formatDate(expiresAt)}
        {expiringSoon && !expired && (
          <span className="text-xs">({t("expiringSoon")})</span>
        )}
        {expired && (
          <span className="text-xs">({t("expired")})</span>
        )}
      </span>
    );
  };

  if (tokens.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
        <p className="text-lg mb-2">{t("noTokens") || "No API tokens yet"}</p>
        <p className="text-sm text-muted-foreground">Create your first API token to get started with the API.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label="API Tokens">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("tokenName")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("permissions")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("status") || "Status"}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("created") || "Created"}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("expiresAt")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("lastUsed")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("actions") || "Actions"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="h-4 bg-surface-elevated rounded w-32" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-surface-elevated rounded w-24" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 bg-surface-elevated rounded-full w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-surface-elevated rounded w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-surface-elevated rounded w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-surface-elevated rounded w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-8 bg-surface-elevated rounded w-8 ml-auto" />
                  </td>
                </tr>
              ))
            ) : (
              tokens.map((token) => (
                <tr key={token.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="font-medium text-sm">{token.name}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-muted-foreground">
                      {formatPermissions(token.permissions)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      variant={token.status === "active" ? "default" : "destructive"}
                      className={cn(
                        token.status === "active"
                          ? "bg-green-500/20 text-green-500 border-green-500/30 hover:bg-green-500/30"
                          : "bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30"
                      )}
                    >
                      {token.status === "active" ? t("active") : t("revoked")}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {formatDate(token.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm">
                      {formatExpiration(token)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {formatDate(token.lastUsedAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRevoke(token)}
                      disabled={token.status === "revoked"}
                      className={cn(
                        "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                        token.status === "revoked" && "opacity-50 cursor-not-allowed"
                      )}
                      aria-label={`${t("revoke")} ${token.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
