"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Linkedin,
  Github,
  Send,
  Instagram,
  Globe,
} from "lucide-react";

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  telegram?: string;
  instagram?: string;
  website?: string;
}

interface SocialLinksInputProps {
  value: SocialLinks;
  onChange: (value: SocialLinks) => void;
  errors?: Partial<Record<keyof SocialLinks, string>>;
}

export function SocialLinksInput({
  value,
  onChange,
  errors,
}: SocialLinksInputProps) {
  const t = useTranslations("settings");

  const handleChange = (field: keyof SocialLinks, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue || undefined,
    });
  };

  const fields: Array<{
    key: keyof SocialLinks;
    icon: typeof Linkedin;
    label: string;
    placeholder: string;
  }> = [
    {
      key: "linkedin",
      icon: Linkedin,
      label: t("linkedin"),
      placeholder: t("linkedinPlaceholder"),
    },
    {
      key: "github",
      icon: Github,
      label: t("github"),
      placeholder: t("githubPlaceholder"),
    },
    {
      key: "telegram",
      icon: Send,
      label: t("telegram"),
      placeholder: t("telegramPlaceholder"),
    },
    {
      key: "instagram",
      icon: Instagram,
      label: t("instagram"),
      placeholder: t("instagramPlaceholder"),
    },
    {
      key: "website",
      icon: Globe,
      label: t("website"),
      placeholder: t("websitePlaceholder"),
    },
  ];

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">{t("socialLinks")}</Label>
      <div className="space-y-3">
        {fields.map(({ key, icon: Icon, label, placeholder }) => (
          <div key={key} className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon className="size-4" />
              </div>
              <Input
                value={value[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="pl-10"
                aria-label={label}
              />
            </div>
            {errors?.[key] && (
              <p className="text-xs text-destructive">{errors[key]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
