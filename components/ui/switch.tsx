"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label
        className={cn(
          "peer relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors",
          "focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:border-ring",
          checked ? "bg-primary" : "bg-input",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <span
          className={cn(
            "pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
