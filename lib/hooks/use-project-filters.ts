"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import type { ProjectStatus } from "@/lib/db";

export type SortOption = "newest" | "oldest" | "mostLiked";

export interface ProjectFilters {
  search: string;
  status: ProjectStatus[];
  roles: string[];
  needsInvestment: boolean | null;
  tags: string[];
  sort: SortOption;
}

const DEFAULT_FILTERS: ProjectFilters = {
  search: "",
  status: [],
  roles: [],
  needsInvestment: null,
  tags: [],
  sort: "newest",
};

/**
 * Custom hook for managing project filter state in URL search params
 * Enables shareable URLs with filter state
 */
export function useProjectFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse current filters from URL
  const filters = useMemo<ProjectFilters>(() => {
    const search = searchParams.get("search") || "";
    const status = (searchParams.get("status")?.split(",").filter(Boolean) || []) as ProjectStatus[];
    const roles = searchParams.get("roles")?.split(",").filter(Boolean) || [];
    const investmentParam = searchParams.get("investment");
    const needsInvestment = investmentParam === "true" ? true : investmentParam === "false" ? false : null;
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const sort = (searchParams.get("sort") as SortOption) || "newest";

    return {
      search,
      status,
      roles,
      needsInvestment,
      tags,
      sort,
    };
  }, [searchParams]);

  // Build URL search params from filters
  const buildSearchParams = useCallback((newFilters: Partial<ProjectFilters>) => {
    const mergedFilters = { ...filters, ...newFilters };
    const params = new URLSearchParams();

    if (mergedFilters.search) {
      params.set("search", mergedFilters.search);
    }
    if (mergedFilters.status.length > 0) {
      params.set("status", mergedFilters.status.join(","));
    }
    if (mergedFilters.roles.length > 0) {
      params.set("roles", mergedFilters.roles.join(","));
    }
    if (mergedFilters.needsInvestment !== null) {
      params.set("investment", String(mergedFilters.needsInvestment));
    }
    if (mergedFilters.tags.length > 0) {
      params.set("tags", mergedFilters.tags.join(","));
    }
    if (mergedFilters.sort !== "newest") {
      params.set("sort", mergedFilters.sort);
    }

    return params;
  }, [filters]);

  // Update URL with new filters
  const setFilters = useCallback(
    (newFilters: Partial<ProjectFilters>) => {
      const params = buildSearchParams(newFilters);
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [buildSearchParams, pathname, router]
  );

  // Set search term
  const setSearch = useCallback(
    (search: string) => setFilters({ search }),
    [setFilters]
  );

  // Toggle status filter
  const toggleStatus = useCallback(
    (status: ProjectStatus) => {
      const newStatus = filters.status.includes(status)
        ? filters.status.filter((s) => s !== status)
        : [...filters.status, status];
      setFilters({ status: newStatus });
    },
    [filters.status, setFilters]
  );

  // Set status filters (replace all)
  const setStatus = useCallback(
    (status: ProjectStatus[]) => setFilters({ status }),
    [setFilters]
  );

  // Toggle role filter
  const toggleRole = useCallback(
    (role: string) => {
      const newRoles = filters.roles.includes(role)
        ? filters.roles.filter((r) => r !== role)
        : [...filters.roles, role];
      setFilters({ roles: newRoles });
    },
    [filters.roles, setFilters]
  );

  // Set roles filters (replace all)
  const setRoles = useCallback(
    (roles: string[]) => setFilters({ roles }),
    [setFilters]
  );

  // Toggle needs investment filter
  const setNeedsInvestment = useCallback(
    (value: boolean | null) => setFilters({ needsInvestment: value }),
    [setFilters]
  );

  // Toggle tag filter
  const toggleTag = useCallback(
    (tag: string) => {
      const newTags = filters.tags.includes(tag)
        ? filters.tags.filter((t) => t !== tag)
        : [...filters.tags, tag];
      setFilters({ tags: newTags });
    },
    [filters.tags, setFilters]
  );

  // Set tags filters (replace all)
  const setTags = useCallback(
    (tags: string[]) => setFilters({ tags }),
    [setFilters]
  );

  // Set sort option
  const setSort = useCallback(
    (sort: SortOption) => setFilters({ sort }),
    [setFilters]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.status.length > 0 ||
      filters.roles.length > 0 ||
      filters.needsInvestment !== null ||
      filters.tags.length > 0
    );
  }, [filters]);

  // Build query string for API calls
  const queryString = useMemo(() => {
    return buildSearchParams(filters).toString();
  }, [buildSearchParams, filters]);

  return {
    filters,
    setFilters,
    setSearch,
    toggleStatus,
    setStatus,
    toggleRole,
    setRoles,
    setNeedsInvestment,
    toggleTag,
    setTags,
    setSort,
    clearFilters,
    hasActiveFilters,
    queryString,
  };
}
