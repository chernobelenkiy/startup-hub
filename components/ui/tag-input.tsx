"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add tag...",
  maxTags = 10,
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (
      trimmedTag &&
      !value.includes(trimmedTag) &&
      value.length < maxTags
    ) {
      onChange([...value, trimmedTag]);
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const tags = pastedText.split(/[,\n]/).filter(Boolean);
    const newTags = tags
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag && !value.includes(tag));
    const availableSlots = maxTags - value.length;
    onChange([...value, ...newTags.slice(0, availableSlots)]);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 p-3 min-h-[42px] rounded-md border border-input bg-transparent shadow-xs transition-colors",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 gap-1 pr-1"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-1 rounded-full hover:bg-primary/40 p-0.5 transition-colors"
            >
              <X className="size-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          )}
        </Badge>
      ))}
      {value.length < maxTags && !disabled && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => inputValue && addTag(inputValue)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          disabled={disabled}
        />
      )}
    </div>
  );
}
