"use client";

import { useTranslations } from "next-intl";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortOption } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

const SORT_OPTIONS: SortOption[] = ["newest", "oldest", "mostLiked"];

export function SortDropdown({ value, onChange, className }: SortDropdownProps) {
  const t = useTranslations();

  const sortLabels: Record<SortOption, string> = {
    newest: t("filters.sortNewest"),
    oldest: t("filters.sortOldest"),
    mostLiked: t("filters.sortMostLiked"),
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ArrowUpDown className="h-4 w-4 text-muted" />
      <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
        <SelectTrigger
          size="sm"
          className="w-[140px] bg-surface-elevated border-border"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {sortLabels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
