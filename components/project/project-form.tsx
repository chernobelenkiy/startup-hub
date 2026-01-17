"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/ui/tag-input";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { LanguageTabs, LanguageTabPanel } from "./language-tabs";
import type { CreateProjectInput, TeamMember, CreateProjectWithTranslationsInput } from "@/lib/validations/project";
import type { ProjectStatus, ProjectTranslation } from "@/lib/db";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/translations/project-translations";

const PROJECT_STATUSES: ProjectStatus[] = ["IDEA", "MVP", "BETA", "LAUNCHED", "PAUSED"];

/** Translation fields for a single language */
interface TranslationData {
  title: string;
  shortDescription: string;
  pitch: string;
  features: string;
  traction: string;
  investmentDetails: string;
}

/** Initial data can include translations array from API */
interface ProjectFormInitialData extends Partial<CreateProjectInput> {
  screenshotUrl?: string | null;
  translations?: Array<{
    language: string;
    title: string;
    shortDescription: string;
    pitch: string;
    features: string | null;
    traction: string | null;
    investmentDetails: string | null;
  }>;
}

interface ProjectFormProps {
  initialData?: ProjectFormInitialData;
  onSubmit: (data: CreateProjectWithTranslationsInput & { screenshotUrl?: string | null }) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

const emptyTranslation: TranslationData = {
  title: "",
  shortDescription: "",
  pitch: "",
  features: "",
  traction: "",
  investmentDetails: "",
};

export function ProjectForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel,
}: ProjectFormProps) {
  const t = useTranslations("project");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("projectStatus");
  const tErrors = useTranslations("errors");
  const tTranslations = useTranslations("translations");

  // Active language tab
  const [activeLanguage, setActiveLanguage] = React.useState<SupportedLanguage>("ru");

  // Build initial translations from initialData
  const buildInitialTranslations = React.useCallback((): Record<SupportedLanguage, TranslationData> => {
    const result: Record<SupportedLanguage, TranslationData> = {
      en: { ...emptyTranslation },
      ru: { ...emptyTranslation },
    };

    // First, try to populate from translations array
    if (initialData?.translations) {
      for (const trans of initialData.translations) {
        const lang = trans.language as SupportedLanguage;
        if (SUPPORTED_LANGUAGES.includes(lang)) {
          result[lang] = {
            title: trans.title || "",
            shortDescription: trans.shortDescription || "",
            pitch: trans.pitch || "",
            features: trans.features || "",
            traction: trans.traction || "",
            investmentDetails: trans.investmentDetails || "",
          };
        }
      }
    }

    // Fallback: if no translations (or empty array) but legacy fields exist, use those
    if ((!initialData?.translations || initialData.translations.length === 0) && initialData?.title) {
      const lang = (initialData.language || "ru") as SupportedLanguage;
      result[lang] = {
        title: initialData.title || "",
        shortDescription: initialData.shortDescription || "",
        pitch: initialData.pitch || "",
        features: "",
        traction: initialData.traction || "",
        investmentDetails: initialData.investmentDetails || "",
      };
    }

    return result;
  }, [initialData]);

  // Translations state for each language
  const [translations, setTranslations] = React.useState<Record<SupportedLanguage, TranslationData>>(
    buildInitialTranslations
  );

  // Non-translatable form state
  const [websiteUrl, setWebsiteUrl] = React.useState(initialData?.websiteUrl || "");
  const [status, setStatus] = React.useState<ProjectStatus>(
    initialData?.status || "IDEA"
  );
  const [tags, setTags] = React.useState<string[]>(initialData?.tags || []);
  const [lookingFor, setLookingFor] = React.useState<string[]>(
    initialData?.lookingFor || []
  );
  const [needsInvestment, setNeedsInvestment] = React.useState(
    initialData?.needsInvestment || false
  );
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>(
    (initialData?.teamMembers as TeamMember[]) || []
  );
  const [estimatedLaunch, setEstimatedLaunch] = React.useState(
    initialData?.estimatedLaunch
      ? new Date(initialData.estimatedLaunch).toISOString().split("T")[0]
      : ""
  );
  const [screenshotUrl, setScreenshotUrl] = React.useState<string | null>(
    initialData?.screenshotUrl || null
  );

  // Validation errors (per language)
  const [errors, setErrors] = React.useState<Record<string, Record<string, string>>>({
    en: {},
    ru: {},
  });

  // Team member form
  const [newMemberName, setNewMemberName] = React.useState("");
  const [newMemberRole, setNewMemberRole] = React.useState("");

  // Update a specific translation field
  const updateTranslation = (
    lang: SupportedLanguage,
    field: keyof TranslationData,
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value,
      },
    }));
  };

  // Check if a language has complete translation
  const isLanguageComplete = (lang: SupportedLanguage): boolean => {
    const trans = translations[lang];
    return !!(
      trans.title.trim() &&
      trans.title.length >= 3 &&
      trans.shortDescription.trim() &&
      trans.shortDescription.length >= 10 &&
      trans.pitch.trim() &&
      trans.pitch.length >= 20
    );
  };

  // Get completed languages
  const completedLanguages = SUPPORTED_LANGUAGES.filter(isLanguageComplete);

  const addTeamMember = () => {
    if (newMemberName.trim() && newMemberRole.trim()) {
      setTeamMembers([
        ...teamMembers,
        { name: newMemberName.trim(), role: newMemberRole.trim() },
      ]);
      setNewMemberName("");
      setNewMemberRole("");
    }
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const validateTranslation = (lang: SupportedLanguage): Record<string, string> => {
    const trans = translations[lang];
    const langErrors: Record<string, string> = {};

    if (trans.title.trim() || trans.shortDescription.trim() || trans.pitch.trim()) {
      // If any field is filled, validate all required fields
      if (!trans.title.trim() || trans.title.length < 3) {
        langErrors.title = tErrors("minLength", { min: 3 });
      }
      if (trans.title.length > 100) {
        langErrors.title = tErrors("maxLength", { max: 100 });
      }
      if (!trans.shortDescription.trim() || trans.shortDescription.length < 10) {
        langErrors.shortDescription = tErrors("minLength", { min: 10 });
      }
      if (trans.shortDescription.length > 280) {
        langErrors.shortDescription = tErrors("maxLength", { max: 280 });
      }
      if (!trans.pitch.trim() || trans.pitch.length < 20) {
        langErrors.pitch = tErrors("minLength", { min: 20 });
      }
      if (trans.pitch.length > 10000) {
        langErrors.pitch = tErrors("maxLength", { max: 10000 });
      }
    }

    return langErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all translations
    const newErrors: Record<string, Record<string, string>> = {
      en: validateTranslation("en"),
      ru: validateTranslation("ru"),
    };

    // Check that at least one complete translation exists
    const hasComplete = completedLanguages.length > 0;
    if (!hasComplete) {
      // Add error to the active language if none is complete
      newErrors[activeLanguage] = {
        ...newErrors[activeLanguage],
        general: tTranslations("atLeastOneRequired"),
      };
    }

    // Check for website URL
    if (websiteUrl && !isValidUrl(websiteUrl)) {
      newErrors.general = { websiteUrl: tErrors("invalidUrl") };
    }

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(
      (langErrors) => Object.keys(langErrors).length > 0
    );

    if (hasErrors) {
      setErrors(newErrors);
      // Switch to the first language with errors
      for (const lang of SUPPORTED_LANGUAGES) {
        if (Object.keys(newErrors[lang]).length > 0) {
          setActiveLanguage(lang);
          break;
        }
      }
      return;
    }

    setErrors({ en: {}, ru: {} });

    // Build translations object for submission
    const submittedTranslations: CreateProjectWithTranslationsInput["translations"] = {};

    for (const lang of SUPPORTED_LANGUAGES) {
      if (isLanguageComplete(lang)) {
        submittedTranslations[lang] = {
          title: translations[lang].title.trim(),
          shortDescription: translations[lang].shortDescription.trim(),
          pitch: translations[lang].pitch.trim(),
          features: translations[lang].features.trim() || null,
          traction: translations[lang].traction.trim() || null,
          investmentDetails: needsInvestment
            ? translations[lang].investmentDetails.trim() || null
            : null,
        };
      }
    }

    await onSubmit({
      translations: submittedTranslations,
      websiteUrl: websiteUrl.trim() || null,
      status,
      tags,
      lookingFor,
      needsInvestment,
      teamMembers,
      estimatedLaunch: estimatedLaunch ? new Date(estimatedLaunch) : null,
      screenshotUrl,
    });
  };

  // Render translation fields for a specific language
  const renderTranslationFields = (lang: SupportedLanguage) => {
    const trans = translations[lang];
    const langErrors = errors[lang] || {};

    return (
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor={`title-${lang}`}>
            {t("title")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`title-${lang}`}
            value={trans.title}
            onChange={(e) => updateTranslation(lang, "title", e.target.value)}
            placeholder={lang === "en" ? "My Awesome Startup" : "Мой крутой стартап"}
            maxLength={100}
            aria-invalid={!!langErrors.title}
          />
          <div className="flex justify-between text-xs">
            {langErrors.title && (
              <span className="text-destructive">{langErrors.title}</span>
            )}
            <span className="text-muted-foreground ml-auto">{trans.title.length}/100</span>
          </div>
        </div>

        {/* Short Description */}
        <div className="space-y-2">
          <Label htmlFor={`shortDescription-${lang}`}>
            {t("shortDescription")} <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id={`shortDescription-${lang}`}
            value={trans.shortDescription}
            onChange={(e) => updateTranslation(lang, "shortDescription", e.target.value)}
            placeholder={
              lang === "en"
                ? "A brief description of your project..."
                : "Краткое описание вашего проекта..."
            }
            maxLength={280}
            className="min-h-[80px]"
            aria-invalid={!!langErrors.shortDescription}
          />
          <div className="flex justify-between text-xs">
            {langErrors.shortDescription && (
              <span className="text-destructive">{langErrors.shortDescription}</span>
            )}
            <span className="text-muted-foreground ml-auto">
              {trans.shortDescription.length}/280
            </span>
          </div>
        </div>

        {/* Pitch */}
        <div className="space-y-2">
          <Label htmlFor={`pitch-${lang}`}>
            {t("pitch")} <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id={`pitch-${lang}`}
            value={trans.pitch}
            onChange={(e) => updateTranslation(lang, "pitch", e.target.value)}
            placeholder={
              lang === "en"
                ? "Explain your project in more detail. What problem does it solve? What makes it unique?"
                : "Расскажите подробнее о вашем проекте. Какую проблему он решает? Что делает его уникальным?"
            }
            maxLength={10000}
            className="min-h-[120px]"
            aria-invalid={!!langErrors.pitch}
          />
          <div className="flex justify-between text-xs">
            {langErrors.pitch && (
              <span className="text-destructive">{langErrors.pitch}</span>
            )}
            <span className="text-muted-foreground ml-auto">{trans.pitch.length}/10000</span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <Label htmlFor={`features-${lang}`}>{t("features")}</Label>
          <Textarea
            id={`features-${lang}`}
            value={trans.features}
            onChange={(e) => updateTranslation(lang, "features", e.target.value)}
            placeholder={
              lang === "en"
                ? "List key features and functionality of your project..."
                : "Перечислите ключевые функции и возможности вашего проекта..."
            }
            maxLength={10000}
            className="min-h-[120px]"
          />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {lang === "en"
                ? "Describe the main features and capabilities"
                : "Опишите основной функционал и возможности"}
            </span>
            <span className="text-muted-foreground">{trans.features.length}/10000</span>
          </div>
        </div>

        {/* Traction */}
        <div className="space-y-2">
          <Label htmlFor={`traction-${lang}`}>{t("traction")}</Label>
          <Textarea
            id={`traction-${lang}`}
            value={trans.traction}
            onChange={(e) => updateTranslation(lang, "traction", e.target.value)}
            placeholder={t("tractionPlaceholder")}
            maxLength={10000}
            className="min-h-[100px]"
          />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t("tractionHint")}</span>
            <span className="text-muted-foreground">{trans.traction.length}/10000</span>
          </div>
        </div>

        {/* Investment Details (only if needsInvestment) */}
        {needsInvestment && (
          <div className="space-y-2">
            <Label htmlFor={`investmentDetails-${lang}`}>{t("investmentDetails")}</Label>
            <Textarea
              id={`investmentDetails-${lang}`}
              value={trans.investmentDetails}
              onChange={(e) => updateTranslation(lang, "investmentDetails", e.target.value)}
              placeholder={
                lang === "en"
                  ? "Describe what kind of investment you're looking for..."
                  : "Опишите, какие инвестиции вы ищете..."
              }
              maxLength={1000}
              className="min-h-[80px]"
            />
            <span className="text-xs text-muted-foreground">
              {trans.investmentDetails.length}/1000
            </span>
          </div>
        )}

        {langErrors.general && (
          <p className="text-sm text-destructive">{langErrors.general}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Language Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label id="content-language-label">{t("contentLanguage")}</Label>
          <p className="text-xs text-muted-foreground">
            {completedLanguages.length === 0
              ? tTranslations("fillAtLeastOne")
              : tTranslations("languagesComplete", { count: completedLanguages.length })}
          </p>
        </div>
        <LanguageTabs
          activeLanguage={activeLanguage}
          onLanguageChange={setActiveLanguage}
          completedLanguages={completedLanguages}
          showValidation
          ariaLabel={t("contentLanguage")}
        />
      </div>

      {/* Translation Fields */}
      {SUPPORTED_LANGUAGES.map((lang) => (
        <LanguageTabPanel key={lang} language={lang} activeLanguage={activeLanguage}>
          {renderTranslationFields(lang)}
        </LanguageTabPanel>
      ))}

      {/* Non-translatable fields */}
      <div className="border-t border-border pt-6 space-y-6">
        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">{t("status")}</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {tStatus(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Website URL */}
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">{t("website")}</Label>
          <Input
            id="websiteUrl"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            aria-invalid={!!errors.general?.websiteUrl}
          />
          {errors.general?.websiteUrl && (
            <span className="text-xs text-destructive">{errors.general.websiteUrl}</span>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>{t("tags")}</Label>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder={t("tagsPlaceholder")}
            maxTags={10}
          />
          <p className="text-xs text-muted-foreground">
            {t("tagsHint")}
          </p>
        </div>

        {/* Looking For */}
        <div className="space-y-2">
          <Label>{t("lookingFor")}</Label>
          <TagInput
            value={lookingFor}
            onChange={setLookingFor}
            placeholder={t("lookingForPlaceholder")}
            maxTags={10}
          />
          <p className="text-xs text-muted-foreground">
            {t("lookingForHint")}
          </p>
        </div>

        {/* Investment */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="needsInvestment">{t("needsInvestment")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("needsInvestmentHint")}
              </p>
            </div>
            <Switch
              id="needsInvestment"
              checked={needsInvestment}
              onCheckedChange={setNeedsInvestment}
            />
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-4">
          <Label>{t("team")}</Label>

          {teamMembers.length > 0 && (
            <div className="space-y-2">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-md bg-surface-elevated"
                >
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTeamMember(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    {tCommon("delete")}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder={t("memberName")}
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="flex-1"
              aria-label={t("memberName")}
            />
            <Input
              placeholder={t("memberRole")}
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="flex-1"
              aria-label={t("memberRole")}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addTeamMember}
              disabled={!newMemberName.trim() || !newMemberRole.trim()}
            >
              {tCommon("add")}
            </Button>
          </div>
        </div>

        {/* Estimated Launch */}
        <div className="space-y-2">
          <Label htmlFor="estimatedLaunch">{t("estimatedLaunch")}</Label>
          <Input
            id="estimatedLaunch"
            type="date"
            value={estimatedLaunch}
            onChange={(e) => setEstimatedLaunch(e.target.value)}
          />
        </div>

        {/* Screenshot Upload */}
        <div className="space-y-2">
          <Label>Screenshot</Label>
          <FileUpload
            value={screenshotUrl}
            onChange={setScreenshotUrl}
            accept="image/*"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
          {submitLabel || tCommon("save")}
        </Button>
      </div>
    </form>
  );
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
