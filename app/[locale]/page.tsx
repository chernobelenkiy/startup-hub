import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ProjectGrid } from "@/components/home";
import { ProjectGridSkeleton } from "@/components/project";
import { UserMenu } from "@/components/auth";
import { McpPopup } from "@/components/mcp";
import { LanguageSwitcher } from "@/components/language-switcher";
import { auth } from "@/lib/auth";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

async function HomeContent() {
  const session = await auth();

  return <HomePageClient isLoggedIn={!!session?.user} />;
}

function HomePageClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <rect width="32" height="32" rx="8" fill="currentColor"/>
                <path d="M16 6L22 12H18V20H14V12H10L16 6Z" fill="white"/>
                <rect x="10" y="22" width="12" height="3" rx="1.5" fill="white"/>
              </svg>
              <span className="hidden sm:inline">{t("common.appName")}</span>
            </Link>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <McpPopup />
            {isLoggedIn ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">{t("navigation.dashboard")}</Link>
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">{t("navigation.signIn")}</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">{t("navigation.signUp")}</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {t("home.hero.title")}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted">
            {t("home.hero.subtitle")}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard/projects">
                {t("project.createProject")}
              </Link>
            </Button>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute -top-40 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </section>

      {/* Main Content - Project Listing */}
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-2xl font-semibold text-foreground">
            {t("home.featured.title")}
          </h2>

          {/* Project Grid with Filters */}
          <Suspense fallback={<ProjectGridSkeleton />}>
            <ProjectGrid />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted">
              &copy; {new Date().getFullYear()} {t("common.appName")}.{" "}
              {t("footer.copyright")}.
            </p>
            <nav className="flex gap-4 text-sm text-muted">
              <Link href="/privacy" className="hover:text-foreground">
                {t("footer.privacy")}
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                {t("footer.terms")}
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                {t("footer.contact")}
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
