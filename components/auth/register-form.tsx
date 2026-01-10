"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RegisterFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function RegisterForm({ onSuccess, className }: RegisterFormProps) {
  const t = useTranslations("auth");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Client-side password validation
  const validatePassword = (pw: string): boolean => {
    return pw.length >= 8 && /\d/.test(pw);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!validatePassword(password)) {
      setError(t("passwordRequirements"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(t("emailExists"));
        } else if (data.details) {
          // Show first validation error
          const firstError = Object.values(data.details)[0];
          setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
        } else {
          setError(t("registrationError"));
        }
        return;
      }

      // Success - call onSuccess callback
      onSuccess?.();
    } catch {
      setError(t("registrationError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="register-email">{t("email")}</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="email"
          className="bg-surface-elevated"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">{t("password")}</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="new-password"
          className="bg-surface-elevated"
        />
        <p className="text-xs text-muted-foreground">
          {t("passwordRequirements")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">{t("confirmPassword")}</Label>
        <Input
          id="register-confirm-password"
          type="password"
          placeholder="********"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="new-password"
          className="bg-surface-elevated"
        />
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("creatingAccount")}
          </>
        ) : (
          t("createAccount")
        )}
      </Button>
    </form>
  );
}
