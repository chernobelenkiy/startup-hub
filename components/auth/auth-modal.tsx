"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type AuthTab = "login" | "register";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: AuthTab;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultTab = "login",
}: AuthModalProps) {
  const t = useTranslations("auth");
  const [activeTab, setActiveTab] = React.useState<AuthTab>(defaultTab);

  // Reset tab when modal opens
  React.useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  function handleLoginSuccess() {
    onOpenChange(false);
  }

  function handleRegisterSuccess() {
    // Show success message and switch to login tab
    toast.success(t("registrationSuccess"));
    setActiveTab("login");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as AuthTab)}
          className="w-full"
        >
          <DialogHeader className="px-6 pt-6 pb-0">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">
                {t("loginTab")}
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                {t("registerTab")}
              </TabsTrigger>
            </TabsList>
          </DialogHeader>

          <TabsContent value="login" className="m-0 p-6 min-h-[420px]">
            <div className="space-y-4">
              <DialogTitle className="text-lg font-semibold">
                {t("welcomeBack")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("signInDescription")}
              </DialogDescription>
              <LoginForm onSuccess={handleLoginSuccess} />
            </div>
          </TabsContent>

          <TabsContent value="register" className="m-0 p-6 min-h-[420px]">
            <div className="space-y-4">
              <DialogTitle className="text-lg font-semibold">
                {t("createAccount")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("signUpDescription")}
              </DialogDescription>
              <RegisterForm onSuccess={handleRegisterSuccess} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
