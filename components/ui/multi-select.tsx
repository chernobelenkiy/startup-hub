"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  maxDisplayed?: number;
}

/**
 * Multi-select dropdown component
 * Shows selected items as badges with remove buttons
 */
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  className,
  maxDisplayed = 2,
}: MultiSelectProps) {
  const handleToggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean) as string[];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-between gap-2 bg-surface-elevated border-border",
            "hover:bg-surface hover:border-border",
            "focus-visible:border-primary focus-visible:ring-primary/30",
            className
          )}
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground font-normal">
              {placeholder}
            </span>
          ) : (
            <div className="flex items-center gap-1 overflow-hidden">
              {selectedLabels.slice(0, maxDisplayed).map((label, index) => (
                <Badge
                  key={selected[index]}
                  variant="outline"
                  className="h-5 px-1.5 text-xs border-primary/30 bg-primary/10 text-primary shrink-0"
                >
                  {label}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(selected[index], e)}
                    className="ml-1 hover:text-primary-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selected.length > maxDisplayed && (
                <Badge
                  variant="outline"
                  className="h-5 px-1.5 text-xs border-border bg-surface text-muted shrink-0"
                >
                  +{selected.length - maxDisplayed}
                </Badge>
              )}
            </div>
          )}
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[200px] max-h-[300px] overflow-auto"
      >
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={() => handleToggle(option.value)}
            onSelect={(e) => e.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
