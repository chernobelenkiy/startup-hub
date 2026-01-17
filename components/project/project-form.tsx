"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { LanguageTabs, LanguageTabPanel } from "./language-tabs";
import {
  TranslationFields,
  ProjectMetadataFields,
  useProjectForm,
  type ProjectFormInitialData,
} from "./form";
import type { CreateProjectWithTranslationsInput } from "@/lib/validations/project";
import { SUPPORTED_LANGUAGES } from "@/lib/translations/project-translations";

interface ProjectFormProps {
  initialData?: ProjectFormInitialData;
  onSubmit: (data: CreateProjectWithTranslationsInput & { screenshotUrl?: string | null }) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ProjectForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel,
}: ProjectFormProps) {
  const t = useTranslations("project");
  const tCommon = useTranslations("common");
  const tTranslations = useTranslations("translations");

  const form = useProjectForm(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.validate()) {
      return;
    }

    await onSubmit(form.buildSubmitData());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Language Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label id="content-language-label">{t("contentLanguage")}</Label>
          <p className="text-xs text-muted-foreground">
            {form.completedLanguages.length === 0
              ? tTranslations("fillAtLeastOne")
              : tTranslations("languagesComplete", { count: form.completedLanguages.length })}
          </p>
        </div>
        <LanguageTabs
          activeLanguage={form.activeLanguage}
          onLanguageChange={form.setActiveLanguage}
          completedLanguages={form.completedLanguages}
          showValidation
          ariaLabel={t("contentLanguage")}
        />
      </div>

      {/* Translation Fields */}
      {SUPPORTED_LANGUAGES.map((lang) => (
        <LanguageTabPanel key={lang} language={lang} activeLanguage={form.activeLanguage}>
          <TranslationFields
            language={lang}
            data={form.translations[lang]}
            errors={form.errors[lang] || {}}
            needsInvestment={form.needsInvestment}
            onUpdate={(field, value) => form.updateTranslation(lang, field, value)}
          />
        </LanguageTabPanel>
      ))}

      {/* Non-translatable metadata fields */}
      <ProjectMetadataFields
        status={form.status}
        websiteUrl={form.websiteUrl}
        tags={form.tags}
        lookingFor={form.lookingFor}
        visible={form.visible}
        needsInvestment={form.needsInvestment}
        teamMembers={form.teamMembers}
        estimatedLaunch={form.estimatedLaunch}
        screenshotUrl={form.screenshotUrl}
        websiteUrlError={form.errors.general?.websiteUrl}
        onStatusChange={form.setStatus}
        onWebsiteUrlChange={form.setWebsiteUrl}
        onTagsChange={form.setTags}
        onLookingForChange={form.setLookingFor}
        onVisibleChange={form.setVisible}
        onNeedsInvestmentChange={form.setNeedsInvestment}
        onTeamMembersChange={form.setTeamMembers}
        onEstimatedLaunchChange={form.setEstimatedLaunch}
        onScreenshotUrlChange={form.setScreenshotUrl}
      />

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

// Re-export for backwards compatibility
export type { ProjectFormInitialData };
