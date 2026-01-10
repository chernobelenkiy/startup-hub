import { cn } from "@/lib/utils";

interface ProjectCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton loading state for ProjectCard
 * Matches the dimensions and layout of the actual card
 */
export function ProjectCardSkeleton({ className }: ProjectCardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-[#111611] overflow-hidden animate-pulse",
        className
      )}
    >
      {/* Screenshot placeholder */}
      <div className="aspect-video w-full bg-surface-elevated" />

      {/* Content */}
      <div className="p-4">
        {/* Title skeleton */}
        <div className="mb-2 h-6 w-3/4 rounded bg-surface-elevated" />

        {/* Description skeleton - 2 lines */}
        <div className="mb-3 space-y-2">
          <div className="h-4 w-full rounded bg-surface-elevated" />
          <div className="h-4 w-2/3 rounded bg-surface-elevated" />
        </div>

        {/* Tags skeleton */}
        <div className="mb-3 flex gap-1.5">
          <div className="h-5 w-12 rounded-full bg-surface-elevated" />
          <div className="h-5 w-16 rounded-full bg-surface-elevated" />
          <div className="h-5 w-10 rounded-full bg-surface-elevated" />
        </div>

        {/* Looking for skeleton */}
        <div className="mb-3 flex items-center gap-1.5">
          <div className="h-4 w-16 rounded bg-surface-elevated" />
          <div className="h-5 w-14 rounded-full bg-surface-elevated" />
          <div className="h-5 w-18 rounded-full bg-surface-elevated" />
        </div>

        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-border-muted">
          <div className="h-4 w-10 rounded bg-surface-elevated" />
          <div className="h-4 w-10 rounded bg-surface-elevated" />
        </div>
      </div>
    </div>
  );
}
