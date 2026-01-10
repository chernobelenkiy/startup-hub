"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Copy, Check, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DeveloperQuickstartProps {
  className?: string;
}

/**
 * Developer quickstart section with curl example
 * Shows how to use API tokens with the Startup Hub API
 */
export function DeveloperQuickstart({ className }: DeveloperQuickstartProps) {
  const t = useTranslations("apiTokens");
  const [copied, setCopied] = useState(false);

  const curlExample = `curl -X GET "https://startuphub.dev/api/v1/projects" \\
  -H "Authorization: Bearer sh_live_your_token_here" \\
  -H "Content-Type: application/json"`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlExample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t("quickstart") || "Developer Quickstart"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={cn(
            "h-7 px-2 text-xs",
            copied && "text-green-500"
          )}
        >
          {copied ? (
            <>
              <Check className="size-3 mr-1" />
              {t("copied") || "Copied"}
            </>
          ) : (
            <>
              <Copy className="size-3 mr-1" />
              {t("copy") || "Copy"}
            </>
          )}
        </Button>
      </div>

      {/* Code block with terminal styling */}
      <div className="p-4 bg-[#1A1F1A] overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed">
          <code>
            <span className="text-gray-400">{"# "}</span>
            <span className="text-gray-500">{t("exampleComment") || "List your projects"}</span>
            {"\n"}
            <span className="text-cyan-400">curl</span>
            <span className="text-gray-300"> -X GET </span>
            <span className="text-green-400">&quot;https://startuphub.dev/api/v1/projects&quot;</span>
            <span className="text-gray-300"> \</span>
            {"\n"}
            <span className="text-gray-300">{"  "}-H </span>
            <span className="text-yellow-400">&quot;Authorization: Bearer </span>
            <span className="text-purple-400">sh_live_your_token_here</span>
            <span className="text-yellow-400">&quot;</span>
            <span className="text-gray-300"> \</span>
            {"\n"}
            <span className="text-gray-300">{"  "}-H </span>
            <span className="text-yellow-400">&quot;Content-Type: application/json&quot;</span>
          </code>
        </pre>
      </div>

      {/* Documentation link */}
      <div className="px-4 py-3 bg-surface/50 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {t("docsDescription") || "Replace"}{" "}
          <code className="px-1 py-0.5 rounded bg-surface text-primary text-xs">
            sh_live_your_token_here
          </code>{" "}
          {t("docsDescriptionSuffix") || "with your actual API token."}
          {" "}
          <Link
            href="/docs/api"
            className="text-primary hover:underline"
          >
            {t("viewDocs") || "View full documentation"}
          </Link>
        </p>
      </div>
    </div>
  );
}
