"use client";

import { Suspense } from "react";
import { useProjectFilters } from "@/lib/hooks";
import { SearchInput } from "./search-input";
import { Filters } from "./filters";
import { SortDropdown } from "./sort-dropdown";
import { InfiniteScrollProjects } from "./infinite-scroll-projects";
import { ProjectCardSkeleton } from "@/components/project/project-card-skeleton";

/**
 * Main project grid with filters, search, and infinite scroll
 * Wrapper component that orchestrates all the filter state
 */
export function ProjectGrid() {
  const {
    filters,
    setSearch,
    setStatus,
    setRoles,
    setNeedsInvestment,
    setTags,
    setSort,
    clearFilters,
    hasActiveFilters,
  } = useProjectFilters();

  return (
    <div className="space-y-6">
      {/* Search and Sort Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={filters.search}
          onChange={setSearch}
          className="w-full sm:max-w-md"
        />
        <SortDropdown value={filters.sort} onChange={setSort} />
      </div>

      {/* Filters */}
      <Filters
        selectedStatus={filters.status}
        selectedRoles={filters.roles}
        needsInvestment={filters.needsInvestment}
        selectedTags={filters.tags}
        onStatusChange={setStatus}
        onRolesChange={setRoles}
        onInvestmentChange={setNeedsInvestment}
        onTagsChange={setTags}
        onClearAll={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Project Cards with Infinite Scroll */}
      <Suspense fallback={<ProjectGridSkeleton />}>
        <InfiniteScrollProjects filters={filters} />
      </Suspense>
    </div>
  );
}

/**
 * Skeleton fallback for project grid
 */
function ProjectGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
