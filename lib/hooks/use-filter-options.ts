"use client";

import useSWR from "swr";

/**
 * Filter option with count of matching projects
 */
export interface FilterOption {
  value: string;
  count: number;
}

/**
 * Response type for the filters API endpoint
 */
export interface FiltersResponse {
  tags: FilterOption[];
  roles: FilterOption[];
  statuses: FilterOption[];
}

/**
 * Fetcher function for SWR
 */
const fetcher = async (url: string): Promise<FiltersResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch filter options");
  }
  return res.json();
};

/**
 * Fallback values for when database is empty or API fails
 * These ensure the UI remains functional
 */
const FALLBACK_TAGS: FilterOption[] = [
  { value: "AI", count: 0 },
  { value: "SaaS", count: 0 },
  { value: "B2B", count: 0 },
  { value: "B2C", count: 0 },
  { value: "Fintech", count: 0 },
  { value: "Healthcare", count: 0 },
  { value: "EdTech", count: 0 },
  { value: "E-commerce", count: 0 },
  { value: "Mobile", count: 0 },
  { value: "Web3", count: 0 },
];

const FALLBACK_ROLES: FilterOption[] = [
  { value: "developer", count: 0 },
  { value: "designer", count: 0 },
  { value: "marketer", count: 0 },
  { value: "productManager", count: 0 },
  { value: "cofounder", count: 0 },
  { value: "investor", count: 0 },
  { value: "advisor", count: 0 },
];

const FALLBACK_STATUSES: FilterOption[] = [
  { value: "IDEA", count: 0 },
  { value: "MVP", count: 0 },
  { value: "BETA", count: 0 },
  { value: "LAUNCHED", count: 0 },
  { value: "PAUSED", count: 0 },
];

/**
 * Custom hook to fetch and cache filter options from the API
 * Uses SWR for efficient caching and revalidation
 *
 * Features:
 * - Caches data for 1 minute (dedupingInterval)
 * - Does not revalidate on focus to avoid excessive API calls
 * - Provides fallback values when data is not available
 * - Returns loading and error states
 */
export function useFilterOptions() {
  const { data, error, isLoading } = useSWR<FiltersResponse>(
    "/api/filters",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
      revalidateIfStale: true,
      errorRetryCount: 2,
    }
  );

  // Use data from API or fallback values
  const tags = data?.tags?.length ? data.tags : FALLBACK_TAGS;
  const roles = data?.roles?.length ? data.roles : FALLBACK_ROLES;
  const statuses = data?.statuses?.length ? data.statuses : FALLBACK_STATUSES;

  return {
    tags,
    roles,
    statuses,
    isLoading,
    error,
  };
}
