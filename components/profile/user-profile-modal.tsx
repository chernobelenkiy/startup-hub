"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Linkedin,
  Github,
  Send,
  Instagram,
  Globe,
  Calendar,
  MessageCircle,
  Loader2,
} from "lucide-react";

interface SocialLinks {
  linkedin?: string;
  github?: string;
  telegram?: string;
  instagram?: string;
  website?: string;
}

interface UserProfile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  title: string | null;
  company: string | null;
  socialLinks: SocialLinks | null;
  openToContact: boolean;
  createdAt: string;
}

interface UserProfileModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({
  userId,
  open,
  onOpenChange,
}: UserProfileModalProps) {
  const t = useTranslations();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      setIsLoading(true);
      setError(null);

      fetch(`/api/user/${userId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load profile");
          return res.json();
        })
        .then((data) => {
          setProfile(data.user);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, userId]);

  const socialIcons = {
    linkedin: { icon: Linkedin, label: "LinkedIn", color: "hover:text-[#0077B5]" },
    github: { icon: Github, label: "GitHub", color: "hover:text-[#333]" },
    telegram: { icon: Send, label: "Telegram", color: "hover:text-[#0088cc]" },
    instagram: { icon: Instagram, label: "Instagram", color: "hover:text-[#E4405F]" },
    website: { icon: Globe, label: "Website", color: "hover:text-primary" },
  };

  const getSocialUrl = (platform: string, value: string): string => {
    switch (platform) {
      case "linkedin":
      case "github":
      case "website":
        return value; // Already full URL
      case "telegram":
        return `https://t.me/${value}`;
      case "instagram":
        return `https://instagram.com/${value}`;
      default:
        return value;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : profile ? (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="size-16 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary overflow-hidden">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name || "User"}
                      className="size-full object-cover"
                    />
                  ) : (
                    profile.name?.[0]?.toUpperCase() || "?"
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl">
                    {profile.name || "Anonymous"}
                  </DialogTitle>

                  {/* Title & Company */}
                  {(profile.title || profile.company) && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {profile.title}
                      {profile.title && profile.company && " at "}
                      {profile.company && (
                        <span className="font-medium">{profile.company}</span>
                      )}
                    </p>
                  )}

                  {/* Open to Contact Badge */}
                  {profile.openToContact && (
                    <Badge
                      variant="outline"
                      className="mt-2 border-green-500/30 bg-green-500/10 text-green-500"
                    >
                      <MessageCircle className="size-3 mr-1" />
                      {t("profile.openToCollaborate")}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Social Links */}
              {profile.socialLinks &&
                Object.keys(profile.socialLinks).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(profile.socialLinks).map(([platform, value]) => {
                      if (!value) return null;
                      const config = socialIcons[platform as keyof typeof socialIcons];
                      if (!config) return null;

                      const Icon = config.icon;
                      const url = getSocialUrl(platform, value);

                      return (
                        <Button
                          key={platform}
                          variant="outline"
                          size="sm"
                          asChild
                          className={`gap-2 ${config.color}`}
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Icon className="size-4" />
                            {config.label}
                          </a>
                        </Button>
                      );
                    })}
                  </div>
                )}

              {/* Member Since */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                <Calendar className="size-3" />
                {t("profile.memberSince")}{" "}
                {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
