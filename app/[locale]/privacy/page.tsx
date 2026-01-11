import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PrivacyContent />;
}

function PrivacyContent() {
  const t = useTranslations("privacy");

  const sections = [
    "collect",
    "use",
    "share",
    "security",
    "rights",
    "contact",
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        {/* Header */}
        <h1 className="text-3xl font-bold text-foreground mb-2">{t("title")}</h1>
        <p className="text-sm text-muted mb-8">
          {t("lastUpdated")}: January 2026
        </p>

        {/* Intro */}
        <p className="text-muted mb-8 leading-relaxed">{t("intro")}</p>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section}>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t(`sections.${section}.title`)}
              </h2>
              <p className="text-muted leading-relaxed">
                {t(`sections.${section}.content`)}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
