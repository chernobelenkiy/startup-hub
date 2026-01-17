"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Eye, EyeOff } from "lucide-react";
import { TeamMembersInput } from "./team-members-input";
import type { ProjectStatus } from "@/lib/db";
import type { TeamMember } from "@/lib/validations/project";

const PROJECT_STATUSES: ProjectStatus[] = ["IDEA", "MVP", "BETA", "LAUNCHED", "PAUSED"];

interface ProjectMetadataFieldsProps {
  status: ProjectStatus;
  websiteUrl: string;
  tags: string[];
  lookingFor: string[];
  visible: boolean;
  needsInvestment: boolean;
  teamMembers: TeamMember[];
  estimatedLaunch: string;
  screenshotUrl: string | null;
  websiteUrlError?: string;
  onStatusChange: (status: ProjectStatus) => void;
  onWebsiteUrlChange: (url: string) => void;
  onTagsChange: (tags: string[]) => void;
  onLookingForChange: (roles: string[]) => void;
  onVisibleChange: (visible: boolean) => void;
  onNeedsInvestmentChange: (needs: boolean) => void;
  onTeamMembersChange: (members: TeamMember[]) => void;
  onEstimatedLaunchChange: (date: string) => void;
  onScreenshotUrlChange: (url: string | null) => void;
}

/**
 * Non-translatable project metadata fields
 * Includes status, website, tags, looking for, visibility, investment, team, launch date, and screenshot
 */
export function ProjectMetadataFields({
  status,
  websiteUrl,
  tags,
  lookingFor,
  visible,
  needsInvestment,
  teamMembers,
  estimatedLaunch,
  screenshotUrl,
  websiteUrlError,
  onStatusChange,
  onWebsiteUrlChange,
  onTagsChange,
  onLookingForChange,
  onVisibleChange,
  onNeedsInvestmentChange,
  onTeamMembersChange,
  onEstimatedLaunchChange,
  onScreenshotUrlChange,
}: ProjectMetadataFieldsProps) {
  const t = useTranslations("project");
  const tStatus = useTranslations("projectStatus");

  return (
    <div className="border-t border-border pt-6 space-y-6">
      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">{t("status")}</Label>
        <Select value={status} onValueChange={(v) => onStatusChange(v as ProjectStatus)}>
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
          onChange={(e) => onWebsiteUrlChange(e.target.value)}
          placeholder="https://example.com"
          aria-invalid={!!websiteUrlError}
        />
        {websiteUrlError && (
          <span className="text-xs text-destructive">{websiteUrlError}</span>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>{t("tags")}</Label>
        <TagInput
          value={tags}
          onChange={onTagsChange}
          placeholder={t("tagsPlaceholder")}
          maxTags={10}
        />
        <p className="text-xs text-muted-foreground">{t("tagsHint")}</p>
      </div>

      {/* Looking For */}
      <div className="space-y-2">
        <Label>{t("lookingFor")}</Label>
        <TagInput
          value={lookingFor}
          onChange={onLookingForChange}
          placeholder={t("lookingForPlaceholder")}
          maxTags={10}
        />
        <p className="text-xs text-muted-foreground">{t("lookingForHint")}</p>
      </div>

      {/* Visibility Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="visible" className="flex items-center gap-2">
              {visible ? (
                <Eye className="size-4 text-green-500" />
              ) : (
                <EyeOff className="size-4 text-muted-foreground" />
              )}
              {t("visibility")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {visible ? t("visibilityPublicHint") : t("visibilityPrivateHint")}
            </p>
          </div>
          <Switch id="visible" checked={visible} onCheckedChange={onVisibleChange} />
        </div>
      </div>

      {/* Investment */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="needsInvestment">{t("needsInvestment")}</Label>
            <p className="text-xs text-muted-foreground">{t("needsInvestmentHint")}</p>
          </div>
          <Switch
            id="needsInvestment"
            checked={needsInvestment}
            onCheckedChange={onNeedsInvestmentChange}
          />
        </div>
      </div>

      {/* Team Members */}
      <TeamMembersInput value={teamMembers} onChange={onTeamMembersChange} />

      {/* Estimated Launch */}
      <div className="space-y-2">
        <Label htmlFor="estimatedLaunch">{t("estimatedLaunch")}</Label>
        <Input
          id="estimatedLaunch"
          type="date"
          value={estimatedLaunch}
          onChange={(e) => onEstimatedLaunchChange(e.target.value)}
        />
      </div>

      {/* Screenshot Upload */}
      <div className="space-y-2">
        <Label>Screenshot</Label>
        <FileUpload value={screenshotUrl} onChange={onScreenshotUrlChange} accept="image/*" />
      </div>
    </div>
  );
}
