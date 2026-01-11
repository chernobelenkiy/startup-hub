import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Key, BookOpen, AlertTriangle } from "lucide-react";

interface McpDocsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function McpDocsPage({ params }: McpDocsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <McpDocsContent />;
}

function McpDocsContent() {
  const t = useTranslations("mcp");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("title")}
          </h1>
          <p className="text-lg text-muted">{t("subtitle")}</p>
        </div>

        {/* Description */}
        <p className="text-muted mb-12 leading-relaxed">{t("description")}</p>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {t("sections.overview.title")}
          </h2>
          <p className="text-muted leading-relaxed">
            {t("sections.overview.content")}
          </p>
        </section>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            {t("sections.authentication.title")}
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            {t("sections.authentication.content")}
          </p>
          <div className="rounded-lg bg-surface-elevated border border-border p-4 font-mono text-sm">
            {t("sections.authentication.example")}
          </div>
          <p className="mt-4 text-sm text-muted">
            {t("sections.authentication.getToken")}{" "}
            <Link
              href="/dashboard/settings/tokens"
              className="text-primary hover:underline"
            >
              {t("sections.authentication.tokenSettings")}
            </Link>
            .
          </p>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t("sections.endpoints.title")}
          </h2>
          <p className="text-muted mb-4">
            {t("sections.endpoints.baseUrl")}:{" "}
            <code className="bg-surface-elevated px-2 py-1 rounded text-primary">
              https://startup-hub.space/api/mcp
            </code>
          </p>

          {/* List Projects */}
          <div className="rounded-lg border border-border bg-surface mb-6">
            <div className="border-b border-border px-4 py-3 bg-surface-elevated">
              <div className="flex items-center gap-2">
                <span className="rounded bg-green-500/20 text-green-400 px-2 py-0.5 text-xs font-mono">
                  GET
                </span>
                <code className="text-sm">/projects</code>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-2">
                {t("sections.listProjects.title")}
              </h3>
              <p className="text-muted text-sm mb-4">
                {t("sections.listProjects.description")}
              </p>
              <div className="text-sm">
                <h4 className="font-medium text-foreground mb-2">Parameters:</h4>
                <ul className="space-y-1 text-muted">
                  <li>
                    <code className="text-primary">cursor</code> -{" "}
                    {t("sections.listProjects.params.cursor")}
                  </li>
                  <li>
                    <code className="text-primary">limit</code> -{" "}
                    {t("sections.listProjects.params.limit")}
                  </li>
                  <li>
                    <code className="text-primary">status</code> -{" "}
                    {t("sections.listProjects.params.status")}
                  </li>
                  <li>
                    <code className="text-primary">tags</code> -{" "}
                    {t("sections.listProjects.params.tags")}
                  </li>
                  <li>
                    <code className="text-primary">search</code> -{" "}
                    {t("sections.listProjects.params.search")}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Get Project */}
          <div className="rounded-lg border border-border bg-surface mb-6">
            <div className="border-b border-border px-4 py-3 bg-surface-elevated">
              <div className="flex items-center gap-2">
                <span className="rounded bg-green-500/20 text-green-400 px-2 py-0.5 text-xs font-mono">
                  GET
                </span>
                <code className="text-sm">/projects/:slug</code>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-2">
                {t("sections.getProject.title")}
              </h3>
              <p className="text-muted text-sm">
                {t("sections.getProject.description")}
              </p>
            </div>
          </div>

          {/* Create Project */}
          <div className="rounded-lg border border-border bg-surface mb-6">
            <div className="border-b border-border px-4 py-3 bg-surface-elevated">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-500/20 text-blue-400 px-2 py-0.5 text-xs font-mono">
                  POST
                </span>
                <code className="text-sm">/projects</code>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-2">
                {t("sections.createProject.title")}
              </h3>
              <p className="text-muted text-sm">
                {t("sections.createProject.description")}
              </p>
            </div>
          </div>

          {/* Update Project */}
          <div className="rounded-lg border border-border bg-surface mb-6">
            <div className="border-b border-border px-4 py-3 bg-surface-elevated">
              <div className="flex items-center gap-2">
                <span className="rounded bg-yellow-500/20 text-yellow-400 px-2 py-0.5 text-xs font-mono">
                  PUT
                </span>
                <code className="text-sm">/projects/:slug</code>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-2">
                {t("sections.updateProject.title")}
              </h3>
              <p className="text-muted text-sm">
                {t("sections.updateProject.description")}
              </p>
            </div>
          </div>

          {/* Delete Project */}
          <div className="rounded-lg border border-border bg-surface mb-6">
            <div className="border-b border-border px-4 py-3 bg-surface-elevated">
              <div className="flex items-center gap-2">
                <span className="rounded bg-red-500/20 text-red-400 px-2 py-0.5 text-xs font-mono">
                  DELETE
                </span>
                <code className="text-sm">/projects/:slug</code>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-2">
                {t("sections.deleteProject.title")}
              </h3>
              <p className="text-muted text-sm">
                {t("sections.deleteProject.description")}
              </p>
            </div>
          </div>

          {/* Like Project */}
          <div className="rounded-lg border border-border bg-surface mb-6">
            <div className="border-b border-border px-4 py-3 bg-surface-elevated">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-500/20 text-blue-400 px-2 py-0.5 text-xs font-mono">
                  POST
                </span>
                <code className="text-sm">/projects/:slug/like</code>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-2">
                {t("sections.likeProject.title")}
              </h3>
              <p className="text-muted text-sm">
                {t("sections.likeProject.description")}
              </p>
            </div>
          </div>
        </section>

        {/* Rate Limiting */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t("sections.rateLimiting.title")}
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            {t("sections.rateLimiting.content")}
          </p>
          <div className="rounded-lg bg-surface-elevated border border-border p-4">
            <ul className="space-y-2 text-sm font-mono text-muted">
              <li>{t("sections.rateLimiting.headers.limit")}</li>
              <li>{t("sections.rateLimiting.headers.remaining")}</li>
              <li>{t("sections.rateLimiting.headers.reset")}</li>
            </ul>
          </div>
        </section>

        {/* Error Handling */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" />
            {t("sections.errors.title")}
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            {t("sections.errors.content")}
          </p>
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-foreground">
                    Code
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-foreground">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-2 font-mono text-primary">400</td>
                  <td className="px-4 py-2 text-muted">
                    {t("sections.errors.codes.400")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-primary">401</td>
                  <td className="px-4 py-2 text-muted">
                    {t("sections.errors.codes.401")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-primary">403</td>
                  <td className="px-4 py-2 text-muted">
                    {t("sections.errors.codes.403")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-primary">404</td>
                  <td className="px-4 py-2 text-muted">
                    {t("sections.errors.codes.404")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-primary">429</td>
                  <td className="px-4 py-2 text-muted">
                    {t("sections.errors.codes.429")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-primary">500</td>
                  <td className="px-4 py-2 text-muted">
                    {t("sections.errors.codes.500")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Example Response */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Example Response
          </h2>
          <div className="rounded-lg bg-surface-elevated border border-border p-4 overflow-x-auto">
            <pre className="text-sm text-muted font-mono">{`{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "abc123",
        "slug": "my-startup",
        "title": "My Startup",
        "shortDescription": "A brief description",
        "status": "MVP",
        "tags": ["AI", "SaaS"],
        "likesCount": 42,
        "createdAt": "2026-01-10T12:00:00Z"
      }
    ],
    "pagination": {
      "cursor": "next_cursor_token",
      "hasMore": true,
      "total": 100
    }
  },
  "requestId": "req_abc123"
}`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
