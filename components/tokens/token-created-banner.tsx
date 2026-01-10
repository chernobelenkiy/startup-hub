"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TokenCreatedBannerProps {
  token: string;
  onDismiss?: () => void;
}

/**
 * Success banner displayed after token creation
 * Shows the token value ONE TIME with copy functionality
 */
export function TokenCreatedBanner({ token, onDismiss }: TokenCreatedBannerProps) {
  const t = useTranslations("apiTokens");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy token:", error);
    }
  };

  return (
    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <CheckCircle className="size-5 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-green-500 mb-1">
            {t("tokenCreated")}
          </h3>

          {/* Token display */}
          <div className="flex items-center gap-2 mt-3 mb-3">
            <code className="flex-1 bg-surface px-3 py-2 rounded-md font-mono text-sm break-all border border-border">
              {token}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className={cn(
                "shrink-0 transition-colors",
                copied && "border-green-500 text-green-500"
              )}
              aria-label={t("copyToken")}
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>

          {/* Warning message */}
          <div className="flex items-start gap-2 text-amber-500 text-sm">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>{t("tokenWarning")}</span>
          </div>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {t("dismiss") || "Dismiss"}
          </Button>
        )}
      </div>
    </div>
  );
}
