"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthModal } from "./auth-modal";

/**
 * Get initials from user name or email
 */
function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const { data: session, status } = useSession();
  const t = useTranslations("navigation");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authTab, setAuthTab] = React.useState<"login" | "register">("login");

  // Loading state
  if (status === "loading") {
    return (
      <div className={className}>
        <Button variant="ghost" size="icon" disabled>
          <div className="size-8 rounded-full bg-muted animate-pulse" />
        </Button>
      </div>
    );
  }

  // User is logged in
  if (session?.user) {
    const user = session.user;
    const initials = getInitials(user.name, user.email);

    return (
      <div className={className}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
            >
              <Avatar className="size-8">
                {user.image && (
                  <AvatarImage src={user.image} alt={user.name || "User"} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {user.name && (
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                )}
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>
              <LayoutDashboard className="mr-2 size-4" />
              {t("dashboard")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <UserIcon className="mr-2 size-4" />
              {t("profile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              variant="destructive"
            >
              <LogOut className="mr-2 size-4" />
              {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // User is not logged in
  return (
    <div className={className}>
      <Button
        variant="default"
        size="sm"
        onClick={() => {
          setAuthTab("login");
          setShowAuthModal(true);
        }}
      >
        {t("signIn")}
      </Button>
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultTab={authTab}
      />
    </div>
  );
}
