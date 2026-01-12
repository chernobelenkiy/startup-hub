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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function McpPopup() {
  const t = useTranslations();
  const [copiedCursor, setCopiedCursor] = React.useState(false);
  const [copiedClaude, setCopiedClaude] = React.useState(false);

  const cursorConfig = `{
  "mcpServers": {
    "startup-hub": {
      "url": "https://www.startup-hub.space/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}`;

  const claudeCodeCommand = `claude mcp add startup-hub \\
  -e MCP_AUTH_TOKEN=YOUR_API_TOKEN \\
  -- npx -y mcp-remote \\
  https://www.startup-hub.space/api/v1/mcp/mcp`;

  const handleCopyCursor = async () => {
    await navigator.clipboard.writeText(cursorConfig);
    setCopiedCursor(true);
    setTimeout(() => setCopiedCursor(false), 2000);
  };

  const handleCopyClaude = async () => {
    await navigator.clipboard.writeText(claudeCodeCommand.replace(/\\\n\s*/g, ""));
    setCopiedClaude(true);
    setTimeout(() => setCopiedClaude(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Code2 className="h-4 w-4" />
          <span className="hidden sm:inline">MCP</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-surface sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            MCP Integration
          </DialogTitle>
          <DialogDescription>
            {t("mcp.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* MCP Config Tabs */}
          <Tabs defaultValue="cursor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
              <TabsTrigger value="claude">Claude Code</TabsTrigger>
            </TabsList>
            <TabsContent value="cursor" className="mt-3">
              <p className="text-sm text-muted mb-3">
                Add to your <code className="text-primary">~/.cursor/mcp.json</code>:
              </p>
              <div className="relative">
                <pre className="rounded-lg bg-surface-elevated border border-border p-4 text-xs font-mono text-muted overflow-x-auto">
                  {cursorConfig}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={handleCopyCursor}
                >
                  {copiedCursor ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="claude" className="mt-3">
              <p className="text-sm text-muted mb-3">
                Run this command in your terminal:
              </p>
              <div className="relative">
                <pre className="rounded-lg bg-surface-elevated border border-border p-4 text-xs font-mono text-muted overflow-x-auto whitespace-pre-wrap">
                  {claudeCodeCommand}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={handleCopyClaude}
                >
                  {copiedClaude ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

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

          {/* Available Tools */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              Available Tools
            </h3>
            <ul className="text-sm text-muted space-y-1">
              <li><code className="text-primary">list_projects</code> - Search and list projects</li>
              <li><code className="text-primary">get_project</code> - Get project details</li>
              <li><code className="text-primary">create_project</code> - Create new project</li>
              <li><code className="text-primary">update_project</code> - Update your project</li>
              <li><code className="text-primary">delete_project</code> - Delete your project</li>
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
