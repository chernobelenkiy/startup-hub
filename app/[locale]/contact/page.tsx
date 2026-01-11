import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Send } from "lucide-react";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ContactContent />;
}

function ContactContent() {
  const t = useTranslations("contact");

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
        <p className="text-lg text-muted mb-8">{t("subtitle")}</p>

        {/* Description */}
        <p className="text-muted mb-12 leading-relaxed">{t("description")}</p>

        {/* Telegram */}
        <div className="rounded-lg border border-border bg-surface p-6 max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-primary/10 p-2">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Telegram
            </h2>
          </div>
          <a
            href="https://t.me/startuphub_space"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            @startuphub_space
          </a>
        </div>
      </div>
    </div>
  );
}
