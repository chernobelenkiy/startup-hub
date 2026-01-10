import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ProjectGrid } from "@/components/home";
import { ProjectCardSkeleton } from "@/components/project";
import { UserMenu } from "@/components/auth";
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
            <Link href="/" className="text-xl font-bold text-primary">
              {t("common.appName")}
            </Link>
          </div>
          <nav className="flex items-center gap-4">
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
              <Link href="/" className="hover:text-foreground">
                {t("footer.privacy")}
              </Link>
              <Link href="/" className="hover:text-foreground">
                {t("footer.terms")}
              </Link>
              <Link href="/" className="hover:text-foreground">
                {t("footer.contact")}
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProjectGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
