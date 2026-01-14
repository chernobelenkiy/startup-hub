"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { ProjectCard } from "@/components/project/project-card";
import { ProjectCardSkeleton } from "@/components/project/project-card-skeleton";
import { EmptyState } from "./empty-state";
import type { ProjectFilters } from "@/lib/hooks";
import type { ProjectStatus } from "@/lib/db";

interface Project {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  screenshotUrl: string | null;
  websiteUrl: string | null;
  status: ProjectStatus;
  tags: string[];
  lookingFor: string[];
  likesCount: number;
  isLiked?: boolean;
  teamMembers: unknown[];
  needsInvestment: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface InfiniteScrollProjectsProps {
  filters: ProjectFilters;
  initialProjects?: Project[];
  initialCursor?: string | null;
  initialHasMore?: boolean;
}

/**
 * Infinite scroll container for project cards
 * Uses IntersectionObserver to load more when bottom is visible
 */
export function InfiniteScrollProjects({
  filters,
  initialProjects = [],
  initialCursor = null,
  initialHasMore = true,
}: InfiniteScrollProjectsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(initialProjects.length === 0);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.status.length > 0 ||
      filters.roles.length > 0 ||
      filters.needsInvestment !== null ||
      filters.tags.length > 0
    );
  }, [filters]);

  // Stable string representations for dependency tracking
  const statusKey = filters.status.join(",");
  const rolesKey = filters.roles.join(",");
  const tagsKey = filters.tags.join(",");

  // Build query string from filters
  const buildQueryString = useCallback(
    (nextCursor?: string | null) => {
      const params = new URLSearchParams();

      // Always include locale for proper translation
      params.set("locale", locale);

      if (filters.search) params.set("search", filters.search);
      if (filters.status.length > 0) params.set("status", filters.status.join(","));
      if (filters.roles.length > 0) params.set("roles", filters.roles.join(","));
      if (filters.needsInvestment !== null) {
        params.set("investment", String(filters.needsInvestment));
      }
      if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
      if (filters.sort !== "newest") params.set("sort", filters.sort);
      if (nextCursor) params.set("cursor", nextCursor);

      return params.toString();
    },
    [filters, locale]
  );

  // Fetch projects from API
  const fetchProjects = useCallback(
    async (isInitial: boolean = false) => {
      if (isLoading) return;

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        const queryString = buildQueryString(isInitial ? null : cursor);
        const response = await fetch(`/api/projects/public?${queryString}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }

        const data = await response.json();

        // Only update state if request wasn't aborted
        if (!abortController.signal.aborted) {
          if (isInitial) {
            setProjects(data.projects);
          } else {
            setProjects((prev) => [...prev, ...data.projects]);
          }

          setCursor(data.nextCursor);
          setHasMore(data.hasMore);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Error fetching projects:", err);
        setError(t("common.error"));
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
          setIsInitialLoad(false);
        }
      }
    },
    [buildQueryString, cursor, isLoading, t]
  );

  // Reset and fetch on filter change or locale change
  useEffect(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setProjects([]);
    setCursor(null);
    setHasMore(true);
    setIsInitialLoad(true);
    fetchProjects(true);

    // Cleanup: abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // Note: fetchProjects intentionally excluded to prevent infinite loop
    // (fetchProjects depends on cursor, which changes on each fetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.search,
    statusKey,
    rolesKey,
    filters.needsInvestment,
    tagsKey,
    filters.sort,
    locale,
  ]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading || isInitialLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchProjects(false);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoading, fetchProjects, isInitialLoad]);

  // Initial loading state
  if (isInitialLoad) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-error mb-4">{error}</p>
        <button
          onClick={() => fetchProjects(true)}
          className="text-primary hover:underline"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  // Empty state - only show when filters are active (no results found)
  // When no filters and no projects, don't show anything
  if (projects.length === 0 && !isLoading) {
    if (hasActiveFilters) {
      return <EmptyState hasFilters={hasActiveFilters} />;
    }
    // No projects and no filters - show nothing
    return null;
  }

  return (
    <div>
      {/* Project grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}

        {/* Loading skeletons while fetching more */}
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <ProjectCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {/* Load more trigger / status */}
      <div ref={loadMoreRef} className="mt-8 flex justify-center">
        {isLoading && !isInitialLoad && (
          <div className="flex items-center gap-2 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("common.loading")}</span>
          </div>
        )}

        {!hasMore && projects.length > 0 && (
          <p className="text-muted-foreground text-sm">
            {t("filters.noMoreProjects")}
          </p>
        )}
      </div>
    </div>
  );
}
