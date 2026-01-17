/**
 * Shared filter types used across API routes and client hooks
 */

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
