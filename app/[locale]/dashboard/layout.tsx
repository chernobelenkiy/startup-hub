import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} />
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 border-b border-border flex items-center px-6 bg-surface shrink-0">
          <Breadcrumbs />
        </header>
        <div className="flex-1 overflow-auto p-6 bg-background">
          {children}
        </div>
      </main>
    </div>
  );
}
