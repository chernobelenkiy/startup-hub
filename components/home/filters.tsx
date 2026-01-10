"use client";

import { useTranslations } from "next-intl";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import type { ProjectStatus } from "@/lib/db";
import { cn } from "@/lib/utils";

/** Available project statuses */
const PROJECT_STATUSES: ProjectStatus[] = [
  "IDEA",
  "MVP",
  "BETA",
  "LAUNCHED",
  "PAUSED",
];

/** Available roles */
const AVAILABLE_ROLES = [
  "developer",
  "designer",
  "marketer",
  "productManager",
  "cofounder",
  "investor",
  "advisor",
] as const;

/** Popular tags for quick filtering */
const POPULAR_TAGS = [
  "AI",
  "SaaS",
  "B2B",
  "B2C",
  "Fintech",
  "Healthcare",
  "EdTech",
  "E-commerce",
  "Mobile",
  "Web3",
];

interface FiltersProps {
  selectedStatus: ProjectStatus[];
  selectedRoles: string[];
  needsInvestment: boolean | null;
  selectedTags: string[];
  onStatusChange: (status: ProjectStatus[]) => void;
  onRolesChange: (roles: string[]) => void;
  onInvestmentChange: (value: boolean | null) => void;
  onTagsChange: (tags: string[]) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function Filters({
  selectedStatus,
  selectedRoles,
  needsInvestment,
  selectedTags,
  onStatusChange,
  onRolesChange,
  onInvestmentChange,
  onTagsChange,
  onClearAll,
  hasActiveFilters,
  className,
}: FiltersProps) {
  const t = useTranslations();
  const tStatus = useTranslations("projectStatus");
  const tRoles = useTranslations("roles");

  // Build status options
  const statusOptions: MultiSelectOption[] = PROJECT_STATUSES.map((status) => ({
    value: status,
    label: tStatus(status),
  }));

  // Build role options
  const roleOptions: MultiSelectOption[] = AVAILABLE_ROLES.map((role) => ({
    value: role,
    label: tRoles(role),
  }));

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
  };

  const handleInvestmentToggle = (checked: boolean) => {
    // If currently true and turning off, set to null (no filter)
    // If null/false and turning on, set to true
    onInvestmentChange(checked ? true : null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter controls - responsive grid */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        {/* Status dropdown */}
        <MultiSelect
          options={statusOptions}
          selected={selectedStatus}
          onChange={(values) => onStatusChange(values as ProjectStatus[])}
          placeholder={t("project.status")}
          className="w-full sm:w-[140px]"
        />

        {/* Roles dropdown */}
        <MultiSelect
          options={roleOptions}
          selected={selectedRoles}
          onChange={onRolesChange}
          placeholder={t("project.lookingFor")}
          className="w-full sm:w-[140px]"
        />

        {/* Needs Investment toggle */}
        <div className="col-span-2 sm:col-span-1 flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-elevated border border-border">
          <Switch
            id="investment-filter"
            checked={needsInvestment === true}
            onCheckedChange={handleInvestmentToggle}
          />
          <Label
            htmlFor="investment-filter"
            className="text-sm cursor-pointer text-foreground whitespace-nowrap"
          >
            {t("project.needsInvestment")}
          </Label>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="col-span-2 sm:col-span-1 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            {t("common.clear")}
          </Button>
        )}
      </div>

      {/* Popular tags - horizontal scroll on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <span className="text-sm text-muted-foreground shrink-0">
          {t("project.tags")}:
        </span>
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            aria-pressed={selectedTags.includes(tag)}
            className={cn(
              "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium shrink-0",
              "cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              selectedTags.includes(tag)
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-surface-elevated text-muted hover:border-primary/50 hover:text-foreground"
            )}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
