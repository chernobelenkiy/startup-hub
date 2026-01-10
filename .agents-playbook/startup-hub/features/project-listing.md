---
feature: Project Listing & Filtering
slug: project-listing
phase: 2-core
status: planned
priority: high
estimated_effort: l
---

# Project Listing & Filtering

## Description
Public homepage displaying all projects in a filterable, sortable grid. Includes search, status filters, role filters, investment filter, and tag filtering with URL state management for shareable filter combinations.

## Acceptance Criteria
- [ ] Homepage displays project cards in responsive grid (2-col tablet, 3-col desktop)
- [ ] Project card shows: screenshot, title, description, tags, team size, looking for roles, status badge, like count
- [ ] Search input filters by title and description (debounced)
- [ ] Filter by status: idea, mvp, beta, launched, paused
- [ ] Filter by "looking for" roles: developer, designer, marketer, etc.
- [ ] Filter by "needs investment" toggle
- [ ] Filter by tags (multi-select)
- [ ] Sort by: newest, oldest, most liked
- [ ] Filters persist in URL query params
- [ ] Infinite scroll pagination (20 items per page)
- [ ] Empty state when no projects match filters

## Technical Notes
- Server Component for initial data, Client Component for interactivity
- URL state via `nuqs` or native `useSearchParams`
- Cursor-based pagination for performance
- Database indexes on status, tags, createdAt

## Design System Components
- **Card**: Dark surface, border, 8px radius, hover elevation
- **Badges**: Status (green/warning/default), Tag (outline green)
- **Search Input**: Magnifying glass icon, elevated background
- **Select/Dropdown**: Filter dropdowns for status, roles
- **Avatar**: Team member count display
- **Like Button**: Heart icon with count

## Test Coverage

| Test Range | Description | Count |
|------------|-------------|-------|
| TC-LIST-001 to TC-LIST-003 | Homepage Display | 3 |
| TC-LIST-010 to TC-LIST-014 | Search Functionality | 5 |
| TC-LIST-020 to TC-LIST-022 | Filter by Status | 3 |
| TC-LIST-030 to TC-LIST-031 | Filter by Roles | 2 |
| TC-LIST-040 | Filter by Investment | 1 |
| TC-LIST-050 to TC-LIST-051 | Filter by Tags | 2 |
| TC-LIST-060 to TC-LIST-062 | Sorting | 3 |
| TC-LIST-070 to TC-LIST-072 | Pagination | 3 |
| TC-LIST-080 to TC-LIST-081 | URL State | 2 |
| TC-LIST-090 | Combined Filters | 1 |

See: [Test Cases](../test-specifications/startup-hub-test-cases.md#3-project-listing--filtering)

## Prompt (use with feature-development)
Implement "Project Listing & Filtering" for Startup Hub. Requirements:
- Homepage with responsive project card grid
- Filter controls: search, status, roles, investment, tags
- URL-based filter state for shareability
- Cursor pagination with infinite scroll
Accept if AC met. See `design.md` for API structure, `design-system.md` for Card/Badge components.
