"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SupportedLanguage } from "@/lib/translations/project-translations";

/** Translation fields for a single language */
export interface TranslationData {
  title: string;
  shortDescription: string;
  pitch: string;
  features: string;
  traction: string;
  investmentDetails: string;
}

interface TranslationFieldsProps {
  language: SupportedLanguage;
  data: TranslationData;
  errors: Record<string, string>;
  needsInvestment: boolean;
  onUpdate: (field: keyof TranslationData, value: string) => void;
}

/**
 * Form fields for a single language translation
 * Includes title, short description, pitch, features, traction, and investment details
 */
export function TranslationFields({
  language,
  data,
  errors,
  needsInvestment,
  onUpdate,
}: TranslationFieldsProps) {
  const t = useTranslations("project");

  const placeholders = {
    en: {
      title: "My Awesome Startup",
      shortDescription: "A brief description of your project...",
      pitch: "Explain your project in more detail. What problem does it solve? What makes it unique?",
      features: "List key features and functionality of your project...",
      featuresHint: "Describe the main features and capabilities",
      investmentDetails: "Describe what kind of investment you're looking for...",
    },
    ru: {
      title: "Мой крутой стартап",
      shortDescription: "Краткое описание вашего проекта...",
      pitch: "Расскажите подробнее о вашем проекте. Какую проблему он решает? Что делает его уникальным?",
      features: "Перечислите ключевые функции и возможности вашего проекта...",
      featuresHint: "Опишите основной функционал и возможности",
      investmentDetails: "Опишите, какие инвестиции вы ищете...",
    },
  };

  const ph = placeholders[language];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor={`title-${language}`}>
          {t("title")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`title-${language}`}
          value={data.title}
          onChange={(e) => onUpdate("title", e.target.value)}
          placeholder={ph.title}
          maxLength={100}
          aria-invalid={!!errors.title}
        />
        <div className="flex justify-between text-xs">
          {errors.title && (
            <span className="text-destructive">{errors.title}</span>
          )}
          <span className="text-muted-foreground ml-auto">{data.title.length}/100</span>
        </div>
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor={`shortDescription-${language}`}>
          {t("shortDescription")} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id={`shortDescription-${language}`}
          value={data.shortDescription}
          onChange={(e) => onUpdate("shortDescription", e.target.value)}
          placeholder={ph.shortDescription}
          maxLength={280}
          className="min-h-[80px]"
          aria-invalid={!!errors.shortDescription}
        />
        <div className="flex justify-between text-xs">
          {errors.shortDescription && (
            <span className="text-destructive">{errors.shortDescription}</span>
          )}
          <span className="text-muted-foreground ml-auto">
            {data.shortDescription.length}/280
          </span>
        </div>
      </div>

      {/* Pitch */}
      <div className="space-y-2">
        <Label htmlFor={`pitch-${language}`}>
          {t("pitch")} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id={`pitch-${language}`}
          value={data.pitch}
          onChange={(e) => onUpdate("pitch", e.target.value)}
          placeholder={ph.pitch}
          maxLength={10000}
          className="min-h-[120px]"
          aria-invalid={!!errors.pitch}
        />
        <div className="flex justify-between text-xs">
          {errors.pitch && (
            <span className="text-destructive">{errors.pitch}</span>
          )}
          <span className="text-muted-foreground ml-auto">{data.pitch.length}/10000</span>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2">
        <Label htmlFor={`features-${language}`}>{t("features")}</Label>
        <Textarea
          id={`features-${language}`}
          value={data.features}
          onChange={(e) => onUpdate("features", e.target.value)}
          placeholder={ph.features}
          maxLength={10000}
          className="min-h-[120px]"
        />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{ph.featuresHint}</span>
          <span className="text-muted-foreground">{data.features.length}/10000</span>
        </div>
      </div>

      {/* Traction */}
      <div className="space-y-2">
        <Label htmlFor={`traction-${language}`}>{t("traction")}</Label>
        <Textarea
          id={`traction-${language}`}
          value={data.traction}
          onChange={(e) => onUpdate("traction", e.target.value)}
          placeholder={t("tractionPlaceholder")}
          maxLength={10000}
          className="min-h-[100px]"
        />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t("tractionHint")}</span>
          <span className="text-muted-foreground">{data.traction.length}/10000</span>
        </div>
      </div>

      {/* Investment Details (only if needsInvestment) */}
      {needsInvestment && (
        <div className="space-y-2">
          <Label htmlFor={`investmentDetails-${language}`}>{t("investmentDetails")}</Label>
          <Textarea
            id={`investmentDetails-${language}`}
            value={data.investmentDetails}
            onChange={(e) => onUpdate("investmentDetails", e.target.value)}
            placeholder={ph.investmentDetails}
            maxLength={1000}
            className="min-h-[80px]"
          />
          <span className="text-xs text-muted-foreground">
            {data.investmentDetails.length}/1000
          </span>
        </div>
      )}

      {errors.general && (
        <p className="text-sm text-destructive">{errors.general}</p>
      )}
    </div>
  );
}
