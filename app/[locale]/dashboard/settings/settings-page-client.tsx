"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User as UserIcon, Mail, Save, Key } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface SettingsPageClientProps {
  user: UserData;
}

export function SettingsPageClient({ user }: SettingsPageClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success(t("settings.profileUpdated"));
      router.refresh();
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-muted">{t("settings.description")}</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {t("settings.profile")}
            </CardTitle>
            <CardDescription>{t("settings.profileDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("settings.name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("settings.namePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("settings.email")}</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted" />
                  <span className="text-muted">{user.email}</span>
                </div>
                <p className="text-xs text-muted">{t("settings.emailNote")}</p>
              </div>

              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? t("common.saving") : t("common.save")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* API Tokens Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t("settings.apiTokens")}
            </CardTitle>
            <CardDescription>{t("settings.apiTokensDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/tokens">
                {t("settings.manageTokens")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
