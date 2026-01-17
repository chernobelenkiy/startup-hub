import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsPageClient } from "./settings-page-client";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Fetch full user profile with enhanced fields
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      avatarUrl: true,
      bio: true,
      title: true,
      company: true,
      socialLinks: true,
      openToContact: true,
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <SettingsPageClient
      user={{
        ...user,
        socialLinks: user.socialLinks as Record<string, string> | null,
      }}
    />
  );
}
