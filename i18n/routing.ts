import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Supported locales
  locales: ["en", "ru"],

  // Default locale when no match
  defaultLocale: "en",

  // Locale prefix strategy
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
