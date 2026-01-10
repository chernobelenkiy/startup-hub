import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthPageClient } from "../auth-page-client";

export default async function RegisterPage() {
  // Check if user is already logged in
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <AuthPageClient defaultTab="register" />;
}
