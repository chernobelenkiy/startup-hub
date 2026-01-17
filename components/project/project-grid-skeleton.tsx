import { ProjectCardSkeleton } from "./project-card-skeleton";

interface ProjectGridSkeletonProps {
  /** Number of skeleton cards to show (default: 6) */
  count?: number;
}

/**
 * Skeleton loading state for a grid of project cards
 * Reusable across different pages that show project grids
 */
export function ProjectGridSkeleton({ count = 6 }: ProjectGridSkeletonProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
