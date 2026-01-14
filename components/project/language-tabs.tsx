"use client";

import type { ReactNode, KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/translations/project-translations";

interface LanguageTabsProps {
  activeLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  /** Languages that have complete translations */
  completedLanguages?: SupportedLanguage[];
  /** Show validation indicator for incomplete translations */
  showValidation?: boolean;
  /** Accessible label for the tab list */
  ariaLabel?: string;
  className?: string;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, { native: string; flag: string }> = {
  en: { native: "EN", flag: "GB" },
  ru: { native: "RU", flag: "RU" },
};

export function LanguageTabs({
  activeLanguage,
  onLanguageChange,
  completedLanguages = [],
  showValidation = false,
  ariaLabel = "Content language",
  className,
}: LanguageTabsProps) {
  // Handle keyboard navigation (arrow keys)
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const languages = SUPPORTED_LANGUAGES;
    let newIndex = currentIndex;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      newIndex = (currentIndex + 1) % languages.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      newIndex = (currentIndex - 1 + languages.length) % languages.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      newIndex = languages.length - 1;
    }

    if (newIndex !== currentIndex) {
      onLanguageChange(languages[newIndex]);
      // Focus the new tab
      const tabId = `lang-tab-${languages[newIndex]}`;
      document.getElementById(tabId)?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex gap-1 p-1 bg-surface-elevated rounded-lg", className)}
    >
      {SUPPORTED_LANGUAGES.map((lang, index) => {
        const isActive = activeLanguage === lang;
        const isComplete = completedLanguages.includes(lang);
        const label = LANGUAGE_LABELS[lang];
        const tabId = `lang-tab-${lang}`;
        const panelId = `lang-panel-${lang}`;

        return (
          <button
            key={lang}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onLanguageChange(lang)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated-hover"
            )}
          >
            <span>{label.native}</span>

            {/* Completion indicator - uses icon + color for accessibility (WCAG 1.4.1) */}
            {showValidation && (
              <span
                className={cn(
                  "flex items-center justify-center w-4 h-4 rounded-full transition-colors",
                  isComplete
                    ? "bg-green-500/20 text-green-500"
                    : "bg-amber-500/20 text-amber-500"
                )}
                aria-label={isComplete ? "Complete" : "Incomplete"}
              >
                {isComplete ? (
                  <Check className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface LanguageTabPanelProps {
  language: SupportedLanguage;
  activeLanguage: SupportedLanguage;
  children: ReactNode;
  className?: string;
}

export function LanguageTabPanel({
  language,
  activeLanguage,
  children,
  className,
}: LanguageTabPanelProps) {
  const isActive = language === activeLanguage;
  const panelId = `lang-panel-${language}`;
  const tabId = `lang-tab-${language}`;

  // Hidden panels are still rendered for form state preservation but visually hidden
  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      hidden={!isActive}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        isActive ? "animate-in fade-in-0 duration-200" : "hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
