"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentState = "pending" | "accepted" | "declined";

export function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const [consent, setConsent] = useState<ConsentState>("pending");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === "accepted" || stored === "declined") {
      setConsent(stored);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setConsent("accepted");
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setConsent("declined");
  };

  if (!mounted || consent !== "pending") {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="relative rounded-lg border bg-background/95 backdrop-blur-sm p-4 md:p-6 shadow-lg">
          <button
            onClick={handleDecline}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pr-8 md:pr-0">
            <h3 className="font-semibold text-foreground mb-2">
              {t("title")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("description")}{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline"
              >
                {t("privacyPolicy")}
              </Link>
              {" "}{t("and")}{" "}
              <Link
                href="/terms"
                className="text-primary hover:underline"
              >
                {t("termsOfService")}
              </Link>
              .
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button onClick={handleAccept} size="sm">
                {t("acceptAll")}
              </Button>
              <Button onClick={handleDecline} variant="outline" size="sm">
                {t("declineOptional")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
