"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

/**
 * Search input with debounced updates
 * Features: search icon, clear button, green focus ring
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const t = useTranslations("home.hero");
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceMs);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Update parent when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder || t("searchPlaceholder")}
        className={cn(
          "pl-10 pr-10",
          "bg-surface-elevated border-border",
          "focus-visible:border-primary focus-visible:ring-primary/30",
          "placeholder:text-muted-foreground"
        )}
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-surface"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
