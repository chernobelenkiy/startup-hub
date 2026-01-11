"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Code2, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function McpPopup() {
  const t = useTranslations();
  const [copied, setCopied] = React.useState(false);

  const mcpConfig = `{
  "mcpServers": {
    "startup-hub": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-client"],
      "env": {
        "STARTUP_HUB_API_URL": "https://your-domain.com/api/mcp",
        "STARTUP_HUB_API_TOKEN": "YOUR_API_TOKEN"
      }
    }
  }
}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(mcpConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Code2 className="h-4 w-4" />
          <span className="hidden sm:inline">MCP</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-surface sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            MCP API
          </DialogTitle>
          <DialogDescription>
            {t("mcp.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick setup */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              Quick Setup
            </h3>
            <p className="text-sm text-muted mb-3">
              Add this to your Claude Code or Cursor MCP settings:
            </p>
            
            {/* Config block */}
            <div className="relative">
              <pre className="rounded-lg bg-surface-elevated border border-border p-4 text-xs font-mono text-muted overflow-x-auto">
                {mcpConfig}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Get API Token */}
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
            <p className="text-sm text-foreground">
              <strong>Get your API token:</strong>{" "}
              <a
                href="/dashboard/settings/tokens"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Dashboard → Settings → API Tokens
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {/* Endpoints summary */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              Available Endpoints
            </h3>
            <ul className="text-sm text-muted space-y-1">
              <li><code className="text-primary">GET /projects</code> - List projects</li>
              <li><code className="text-primary">GET /projects/:slug</code> - Get project</li>
              <li><code className="text-primary">POST /projects</code> - Create project</li>
              <li><code className="text-primary">PUT /projects/:slug</code> - Update project</li>
              <li><code className="text-primary">DELETE /projects/:slug</code> - Delete project</li>
              <li><code className="text-primary">POST /projects/:slug/like</code> - Toggle like</li>
            </ul>
          </div>

          {/* Full docs link */}
          <div className="pt-2 border-t border-border">
            <a
              href="/docs/mcp"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View full documentation
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
