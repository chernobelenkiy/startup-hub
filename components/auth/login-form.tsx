"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function LoginForm({ onSuccess, className }: LoginFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check if the error message contains rate limit info
        if (result.error.includes("Too many login attempts")) {
          setError(result.error);
        } else {
          setError(t("invalidCredentials"));
        }
        return;
      }

      // Success - refresh and call onSuccess callback
      router.refresh();
      onSuccess?.();
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
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
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="current-password"
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
            {t("signingIn")}
          </>
        ) : (
          t("signIn")
        )}
      </Button>
    </form>
  );
}
