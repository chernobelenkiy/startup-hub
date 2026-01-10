"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Permission = "read" | "create" | "update" | "delete";
type ExpirationOption = "never" | "30days" | "90days" | "1year" | "custom";

interface GenerateTokenFormProps {
  onGenerate: (name: string, permissions: Permission[], expiresAt?: Date) => Promise<void>;
  isLoading?: boolean;
  tokenCount?: number;
  maxTokens?: number;
}

/**
 * Form for generating new API tokens
 * Includes name input and permission checkboxes
 */
export function GenerateTokenForm({
  onGenerate,
  isLoading = false,
  tokenCount = 0,
  maxTokens = 10,
}: GenerateTokenFormProps) {
  const t = useTranslations("apiTokens");
  const tPermissions = useTranslations("permissions");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(["read"]);
  const [expirationOption, setExpirationOption] = useState<ExpirationOption>("never");
  const [customDate, setCustomDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const allPermissions: Permission[] = ["read", "create", "update", "delete"];

  /**
   * Calculate expiration date based on selected option
   */
  const calculateExpirationDate = (): Date | undefined => {
    const now = new Date();

    switch (expirationOption) {
      case "never":
        return undefined;
      case "30days":
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case "90days":
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      case "1year":
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      case "custom":
        return customDate ? new Date(customDate) : undefined;
      default:
        return undefined;
    }
  };

  /**
   * Get minimum date for custom date picker (tomorrow)
   */
  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const handlePermissionToggle = (permission: Permission) => {
    setPermissions((prev) => {
      if (prev.includes(permission)) {
        // Don't allow removing last permission
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(tErrors("required"));
      return;
    }

    if (permissions.length === 0) {
      setError("At least one permission is required");
      return;
    }

    // Validate custom date if selected
    if (expirationOption === "custom" && !customDate) {
      setError(t("selectExpirationDate"));
      return;
    }

    const expiresAt = calculateExpirationDate();

    try {
      await onGenerate(name.trim(), permissions, expiresAt);
      setName("");
      setPermissions(["read"]);
      setExpirationOption("never");
      setCustomDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate token");
    }
  };

  const isNearLimit = tokenCount >= maxTokens - 2;
  const isAtLimit = tokenCount >= maxTokens;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Token name input */}
      <div className="space-y-2">
        <Label htmlFor="token-name">{t("tokenName")}</Label>
        <Input
          id="token-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Production API Key"
          disabled={isLoading || isAtLimit}
          maxLength={100}
        />
      </div>

      {/* Permissions checkboxes */}
      <div className="space-y-2">
        <Label>{t("permissions")}</Label>
        <div className="flex flex-wrap gap-3">
          {allPermissions.map((permission) => (
            <label
              key={permission}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors",
                permissions.includes(permission)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50",
                (isLoading || isAtLimit) && "opacity-50 cursor-not-allowed"
              )}
            >
              <input
                type="checkbox"
                checked={permissions.includes(permission)}
                onChange={() => handlePermissionToggle(permission)}
                disabled={isLoading || isAtLimit}
                className="sr-only"
              />
              <span
                className={cn(
                  "size-4 rounded border flex items-center justify-center",
                  permissions.includes(permission)
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-input"
                )}
              >
                {permissions.includes(permission) && (
                  <svg
                    className="size-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.5 6L5 8.5L9.5 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="text-sm">
                {tPermissions(permission)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Expiration selection */}
      <div className="space-y-2">
        <Label htmlFor="expiration">{t("expiration")}</Label>
        <Select
          value={expirationOption}
          onValueChange={(value: ExpirationOption) => setExpirationOption(value)}
          disabled={isLoading || isAtLimit}
        >
          <SelectTrigger id="expiration" className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">{t("expirationNever")}</SelectItem>
            <SelectItem value="30days">{t("expiration30Days")}</SelectItem>
            <SelectItem value="90days">{t("expiration90Days")}</SelectItem>
            <SelectItem value="1year">{t("expiration1Year")}</SelectItem>
            <SelectItem value="custom">{t("expirationCustom")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Custom date picker */}
        {expirationOption === "custom" && (
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="size-4 text-muted-foreground" />
            <Input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              min={getMinDate()}
              disabled={isLoading || isAtLimit}
              className="w-full sm:w-[200px]"
            />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">{error}</p>
      )}

      {/* Token limit warning */}
      {isNearLimit && !isAtLimit && (
        <p className="text-sm text-amber-500">
          {t("tokenLimitWarning") || `You have ${tokenCount} of ${maxTokens} tokens. Consider revoking unused tokens.`}
        </p>
      )}

      {isAtLimit && (
        <p className="text-sm text-destructive">
          {t("tokenLimitReached") || `Maximum of ${maxTokens} active tokens reached. Revoke an existing token to create a new one.`}
        </p>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading || isAtLimit || !name.trim()}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {tCommon("loading")}
          </>
        ) : (
          t("createToken")
        )}
      </Button>
    </form>
  );
}
