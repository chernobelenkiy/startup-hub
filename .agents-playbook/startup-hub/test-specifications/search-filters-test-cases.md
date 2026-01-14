# Search Filters - Test Cases

**Feature:** Search Filters with Real Database Data
**Version:** 1.0
**Date:** 2026-01-14
**Status:** Implemented

---

## Overview

Test cases for the search filters feature that fetches dynamic filter options (tags, roles, statuses) from the database instead of using hardcoded values.

**Components Tested:**
- API Endpoint: `/api/filters`
- Hook: `useFilterOptions`
- Component: `Filters`

---

## Unit Tests - API Endpoint

### TC-FILT-001: API returns correct structure
- **Type:** Unit
- **Priority:** P0
- **Status:** Implemented
- **File:** `/tests/unit/filters-api.test.ts`
- **Details:** Verify that GET /api/filters returns `{ tags, roles, statuses }` structure
- **Expected Result:** Response has all three properties as arrays of `{ value: string, count: number }`

### TC-FILT-002: Empty database returns empty arrays
- **Type:** Unit
- **Priority:** P0
- **Status:** Implemented
- **File:** `/tests/unit/filters-api.test.ts`
- **Details:** When no projects exist in database, API returns empty arrays for all fields
- **Expected Result:** `{ tags: [], roles: [], statuses: [] }`

### TC-FILT-003: Tags sorted by count descending
- **Type:** Unit
- **Priority:** P1
- **Status:** Implemented
- **File:** `/tests/unit/filters-api.test.ts`
- **Details:** Tags are returned in order of most popular (highest count) first
- **Expected Result:** First tag has highest count, subsequent tags have equal or lower counts

### TC-FILT-004: Tags limited to 20 items
- **Type:** Unit
- **Priority:** P1
- **Status:** Implemented
- **File:** `/tests/unit/filters-api.test.ts`
- **Details:** API returns maximum of 20 tags even if more exist in database
- **Expected Result:** tags array has at most 20 items

### TC-FILT-005: Roles aggregated correctly with counts
- **Type:** Unit
- **Priority:** P0
- **Status:** Implemented
- **File:** `/tests/unit/filters-api.test.ts`
- **Details:** Roles are aggregated from `lookingFor` field across all projects
- **Expected Result:** Each role appears once with accurate count of projects seeking that role

### TC-FILT-006: Statuses grouped correctly with counts
- **Type:** Unit
- **Priority:** P0
- **Status:** Implemented
- **File:** `/tests/unit/filters-api.test.ts`
- **Details:** All project statuses (IDEA, MVP, BETA, LAUNCHED, PAUSED) appear with counts
- **Expected Result:** Statuses grouped with `_count` values correctly transformed

### TC-FILT-007: Database errors return 500 response
- **Type:** Unit
- **Priority:** P0
- **Status:** Implemented
- **File:** `/tests/unit/filters-api.test.ts`
- **Details:** When database query fails, API returns 500 with error message
- **Expected Result:** `{ error: "Failed to fetch filter options" }` with status 500

### TC-FILT-008: BigInt conversion handles large numbers
- **Type:** Unit
- **Priority:** P2
- **Status:** Implemented
- **File:** `/tests/unit/filters-api.test.ts`
- **Details:** PostgreSQL returns BigInt for COUNT(), API converts to JavaScript number
- **Expected Result:** Count values are JavaScript numbers, not BigInt

### TC-FILT-009: Cache headers are set correctly
- **Type:** Unit
- **Priority:** P1
- **Status:** Implemented
- **File:** `/tests/unit/filters-api.test.ts`
- **Details:** Response includes CDN cache headers for performance
- **Expected Result:** `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`

### TC-FILT-010: Handles empty tag/role values gracefully
- **Type:** Unit
- **Priority:** P2
- **Status:** Implemented
- **File:** `/tests/unit/filters-api.test.ts`
- **Details:** Edge case where UNNEST returns empty strings
- **Expected Result:** API returns 200 with results including empty strings

### TC-FILT-011: Database groupBy error handling
- **Type:** Unit
- **Priority:** P1
- **Status:** Implemented
- **File:** `/tests/unit/filters-api.test.ts`
- **Details:** When status groupBy fails, API returns 500
- **Expected Result:** Error is caught and 500 response returned

---

## Integration Tests - Full Flow

### TC-FILT-INT-001: Full flow with created projects
- **Type:** Integration
- **Priority:** P0
- **Status:** Implemented
- **File:** `/tests/integration/filters.test.ts`
- **Details:** Create projects with tags/roles, call filters API, verify data appears
- **Expected Result:** Tags and roles from created projects appear in filter results

### TC-FILT-INT-002: Filter counts match actual project counts
- **Type:** Integration
- **Priority:** P0
- **Status:** Implemented
- **File:** `/tests/integration/filters.test.ts`
- **Details:** Verify count values accurately reflect number of matching projects
- **Expected Result:** Tag count of 5 means exactly 5 projects have that tag

### TC-FILT-INT-003: Multiple projects with same tags aggregate correctly
- **Type:** Integration
- **Priority:** P1
- **Status:** Implemented
- **File:** `/tests/integration/filters.test.ts`
- **Details:** 10 projects with "AI" tag should show count of 10
- **Expected Result:** Aggregation sums all occurrences correctly

### TC-FILT-INT-004: Projects with multiple tags count towards each
- **Type:** Integration
- **Priority:** P1
- **Status:** Implemented
- **File:** `/tests/integration/filters.test.ts`
- **Details:** Project with ["AI", "SaaS"] counts toward both tags
- **Expected Result:** Both AI and SaaS filters show project in their counts

### TC-FILT-INT-005: Projects with multiple roles count towards each
- **Type:** Integration
- **Priority:** P1
- **Status:** Implemented
- **File:** `/tests/integration/filters.test.ts`
- **Details:** Project looking for ["developer", "designer"] counts toward both
- **Expected Result:** Both developer and designer filters show project in counts

### TC-FILT-INT-006: Mixed scenario with various projects
- **Type:** Integration
- **Priority:** P1
- **Status:** Implemented
- **File:** `/tests/integration/filters.test.ts`
- **Details:** Complex scenario with different statuses, tags, and roles
- **Expected Result:** All aggregations are mathematically correct

### TC-FILT-INT-007: Projects without tags/roles handled
- **Type:** Integration
- **Priority:** P2
- **Status:** Implemented
- **File:** `/tests/integration/filters.test.ts`
- **Details:** Projects with empty tags/lookingFor arrays don't break aggregation
- **Expected Result:** Other filters still work, empty arrays don't contribute

### TC-FILT-INT-008: Ordering maintained in results
- **Type:** Integration
- **Priority:** P1
- **Status:** Implemented
- **File:** `/tests/integration/filters.test.ts`
- **Details:** Results maintain descending order by count
- **Expected Result:** First item always has highest or equal count to second item

---

## Future Test Cases (Not Yet Implemented)

### TC-FILT-E2E-001: Filter UI displays loading state
- **Type:** E2E
- **Priority:** P2
- **Status:** Pending
- **Details:** While fetching filters, show skeleton loading animation
- **Expected Result:** Loading skeletons appear for tags section

### TC-FILT-E2E-002: Filter UI displays counts in badges
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Details:** Each filter option shows count in parentheses
- **Expected Result:** "AI (5)" displays for tag with 5 projects

### TC-FILT-E2E-003: Fallback values when API fails
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Details:** When API fails, hook returns fallback filter options
- **Expected Result:** UI still shows filter options with count of 0

### TC-FILT-E2E-004: SWR caching prevents excessive requests
- **Type:** E2E
- **Priority:** P2
- **Status:** Pending
- **Details:** Multiple renders don't trigger multiple API calls
- **Expected Result:** Only one API call per minute (dedupingInterval)

---

## Test Coverage Summary

| Test Type | Total | Implemented | Pending |
|-----------|-------|-------------|---------|
| Unit Tests | 11 | 11 | 0 |
| Integration Tests | 8 | 8 | 0 |
| E2E Tests | 4 | 0 | 4 |
| **Total** | **23** | **19** | **4** |

---

## Traceability

| Test Case | Requirement | Implementation File |
|-----------|-------------|---------------------|
| TC-FILT-001 to TC-FILT-011 | API returns aggregated filters | `/app/api/filters/route.ts` |
| TC-FILT-INT-001 to TC-FILT-INT-008 | Full flow verification | `/app/api/filters/route.ts` |
| TC-FILT-E2E-* | UI displays dynamic data | `/components/home/filters.tsx`, `/lib/hooks/use-filter-options.ts` |
