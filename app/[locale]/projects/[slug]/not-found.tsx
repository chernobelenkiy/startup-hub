import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FolderX, Home, Search } from "lucide-react";

export default async function ProjectNotFound() {
  const t = await getTranslations("errors");
  const tNav = await getTranslations("navigation");

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh] py-16 px-4 text-center">
      <div className="size-20 rounded-full bg-surface-elevated flex items-center justify-center mb-6">
        <FolderX className="size-10 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-2">{t("notFound")}</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The project you are looking for does not exist or has been removed.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/">
            <Home className="size-4 mr-2" />
            {tNav("home")}
          </Link>
        </Button>
        <Button asChild>
          <Link href="/explore">
            <Search className="size-4 mr-2" />
            {tNav("explore")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
