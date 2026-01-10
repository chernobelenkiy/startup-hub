import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Heart, Activity } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations("dashboard");

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Fetch user stats
  const [projectCount, totalLikes] = await Promise.all([
    db.project.count({
      where: { ownerId: session.user.id },
    }),
    db.project.aggregate({
      where: { ownerId: session.user.id },
      _sum: { likesCount: true },
    }),
  ]);

  const stats = [
    {
      label: t("totalProjects"),
      value: projectCount,
      icon: FolderKanban,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: t("totalLikes"),
      value: totalLikes._sum.likesCount || 0,
      icon: Heart,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("overview")}</h1>
        <p className="text-muted-foreground">
          {t("welcome")}, {session.user.name || session.user.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`size-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="size-5" />
            <CardTitle>{t("recentActivity")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No recent activity to display.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
