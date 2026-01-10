"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth/auth-modal";

interface AuthPageClientProps {
  defaultTab: "login" | "register";
}

export function AuthPageClient({ defaultTab }: AuthPageClientProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(true);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      // Navigate back to home when modal is closed
      router.push("/");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthModal
        open={open}
        onOpenChange={handleOpenChange}
        defaultTab={defaultTab}
      />
    </div>
  );
}
