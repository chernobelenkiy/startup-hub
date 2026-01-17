"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialLinksInput, type SocialLinks } from "@/components/profile";
import { toast } from "sonner";
import { User as UserIcon, Mail, Save, Key, Briefcase, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
  title?: string | null;
  company?: string | null;
  socialLinks?: SocialLinks | null;
  openToContact?: boolean;
}

interface SettingsPageClientProps {
  user: UserData;
}

export function SettingsPageClient({ user }: SettingsPageClientProps) {
  const t = useTranslations();
  const router = useRouter();
  
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [title, setTitle] = useState(user.title || "");
  const [company, setCompany] = useState(user.company || "");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(user.socialLinks || {});
  const [openToContact, setOpenToContact] = useState(user.openToContact || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          bio: bio || null,
          title: title || null,
          company: company || null,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
          openToContact,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success(t("settings.profileUpdated"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {t("settings.profile")}
            </CardTitle>
            <CardDescription>{t("settings.profileDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="bio">{t("settings.bio")}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("settings.bioPlaceholder")}
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-muted">
                {t("settings.bioHint")} ({bio.length}/1000)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {t("settings.jobTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">{t("settings.jobTitle")}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("settings.jobTitlePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">{t("settings.company")}</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={t("settings.companyPlaceholder")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.socialLinks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <SocialLinksInput
              value={socialLinks}
              onChange={setSocialLinks}
            />
          </CardContent>
        </Card>

        {/* Contact Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {t("settings.openToContact")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="openToContact" className="cursor-pointer">
                  {t("settings.openToContact")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.openToContactHint")}
                </p>
              </div>
              <Switch
                id="openToContact"
                checked={openToContact}
                onCheckedChange={setOpenToContact}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>

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
  );
}
