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
import type { CreateProjectInput, TeamMember } from "@/lib/validations/project";
import type { ProjectStatus } from "@/lib/db";

const PROJECT_STATUSES: ProjectStatus[] = ["IDEA", "MVP", "BETA", "LAUNCHED", "PAUSED"];

const LOOKING_FOR_ROLES = [
  "developer",
  "designer",
  "marketer",
  "productManager",
  "cofounder",
  "investor",
  "advisor",
] as const;

interface ProjectFormProps {
  initialData?: Partial<CreateProjectInput> & { screenshotUrl?: string | null };
  onSubmit: (data: CreateProjectInput & { screenshotUrl?: string | null }) => Promise<void>;
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
  const tStatus = useTranslations("projectStatus");
  const tRoles = useTranslations("roles");
  const tErrors = useTranslations("errors");

  // Form state
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [shortDescription, setShortDescription] = React.useState(
    initialData?.shortDescription || ""
  );
  const [pitch, setPitch] = React.useState(initialData?.pitch || "");
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
  const [investmentDetails, setInvestmentDetails] = React.useState(
    initialData?.investmentDetails || ""
  );
  const [traction, setTraction] = React.useState(initialData?.traction || "");
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
  const [language, setLanguage] = React.useState<"en" | "ru">(
    initialData?.language || "en"
  );

  // Validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Team member form
  const [newMemberName, setNewMemberName] = React.useState("");
  const [newMemberRole, setNewMemberRole] = React.useState("");

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

  const toggleRole = (role: string) => {
    if (lookingFor.includes(role)) {
      setLookingFor(lookingFor.filter((r) => r !== role));
    } else {
      setLookingFor([...lookingFor, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.length < 3) {
      newErrors.title = tErrors("minLength", { min: 3 });
    }
    if (title.length > 100) {
      newErrors.title = tErrors("maxLength", { max: 100 });
    }
    if (!shortDescription.trim() || shortDescription.length < 10) {
      newErrors.shortDescription = tErrors("minLength", { min: 10 });
    }
    if (shortDescription.length > 280) {
      newErrors.shortDescription = tErrors("maxLength", { max: 280 });
    }
    if (!pitch.trim() || pitch.length < 20) {
      newErrors.pitch = tErrors("minLength", { min: 20 });
    }
    if (pitch.length > 500) {
      newErrors.pitch = tErrors("maxLength", { max: 500 });
    }
    if (websiteUrl && !isValidUrl(websiteUrl)) {
      newErrors.websiteUrl = "Invalid URL";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit({
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      pitch: pitch.trim(),
      websiteUrl: websiteUrl.trim() || null,
      status,
      tags,
      lookingFor,
      traction: traction.trim() || null,
      needsInvestment,
      investmentDetails: needsInvestment ? investmentDetails.trim() : null,
      teamMembers,
      estimatedLaunch: estimatedLaunch ? new Date(estimatedLaunch) : null,
      screenshotUrl,
      language,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          {t("title")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Awesome Startup"
          maxLength={100}
          aria-invalid={!!errors.title}
        />
        <div className="flex justify-between text-xs">
          {errors.title && (
            <span className="text-destructive">{errors.title}</span>
          )}
          <span className="text-muted-foreground ml-auto">{title.length}/100</span>
        </div>
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="shortDescription">
          {t("shortDescription")} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="shortDescription"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="A brief description of your project..."
          maxLength={280}
          className="min-h-[80px]"
          aria-invalid={!!errors.shortDescription}
        />
        <div className="flex justify-between text-xs">
          {errors.shortDescription && (
            <span className="text-destructive">{errors.shortDescription}</span>
          )}
          <span className="text-muted-foreground ml-auto">
            {shortDescription.length}/280
          </span>
        </div>
      </div>

      {/* Pitch */}
      <div className="space-y-2">
        <Label htmlFor="pitch">
          {t("pitch")} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="pitch"
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="Explain your project in more detail. What problem does it solve? What makes it unique?"
          maxLength={500}
          className="min-h-[120px]"
          aria-invalid={!!errors.pitch}
        />
        <div className="flex justify-between text-xs">
          {errors.pitch && (
            <span className="text-destructive">{errors.pitch}</span>
          )}
          <span className="text-muted-foreground ml-auto">{pitch.length}/500</span>
        </div>
      </div>

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
          aria-invalid={!!errors.websiteUrl}
        />
        {errors.websiteUrl && (
          <span className="text-xs text-destructive">{errors.websiteUrl}</span>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>{t("tags")}</Label>
        <TagInput
          value={tags}
          onChange={setTags}
          placeholder="Add tags (press Enter or comma)"
          maxTags={10}
        />
        <p className="text-xs text-muted-foreground">
          Press Enter or comma to add a tag. Maximum 10 tags.
        </p>
      </div>

      {/* Looking For */}
      <div className="space-y-2">
        <Label>{t("lookingFor")}</Label>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR_ROLES.map((role) => (
            <Button
              key={role}
              type="button"
              variant={lookingFor.includes(role) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleRole(role)}
            >
              {tRoles(role)}
            </Button>
          ))}
        </div>
      </div>

      {/* Traction */}
      <div className="space-y-2">
        <Label htmlFor="traction">{t("traction")}</Label>
        <Textarea
          id="traction"
          value={traction}
          onChange={(e) => setTraction(e.target.value)}
          placeholder={t("tractionPlaceholder")}
          maxLength={2000}
          className="min-h-[100px]"
        />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t("tractionHint")}</span>
          <span className="text-muted-foreground">{traction.length}/2000</span>
        </div>
      </div>

      {/* Investment */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="needsInvestment">{t("needsInvestment")}</Label>
            <p className="text-xs text-muted-foreground">
              Toggle if you are looking for investors
            </p>
          </div>
          <Switch
            id="needsInvestment"
            checked={needsInvestment}
            onCheckedChange={setNeedsInvestment}
          />
        </div>

        {needsInvestment && (
          <div className="space-y-2">
            <Label htmlFor="investmentDetails">{t("investmentDetails")}</Label>
            <Textarea
              id="investmentDetails"
              value={investmentDetails}
              onChange={(e) => setInvestmentDetails(e.target.value)}
              placeholder="Describe what kind of investment you're looking for..."
              maxLength={1000}
              className="min-h-[80px]"
            />
            <span className="text-xs text-muted-foreground">
              {investmentDetails.length}/1000
            </span>
          </div>
        )}
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
            placeholder="Name"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="flex-1"
            aria-label="Team member name"
          />
          <Input
            placeholder="Role"
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value)}
            className="flex-1"
            aria-label="Team member role"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTeamMember}
            disabled={!newMemberName.trim() || !newMemberRole.trim()}
          >
            Add
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

      {/* Language */}
      <div className="space-y-2">
        <Label>Content Language</Label>
        <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "ru")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ru">Russian</SelectItem>
          </SelectContent>
        </Select>
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
