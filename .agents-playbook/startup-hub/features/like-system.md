---
feature: Like System
slug: like-system
phase: 3-engagement
status: planned
priority: medium
estimated_effort: m
---

# Like System

## Description
Allow authenticated users to like/unlike projects with optimistic UI updates. Displays like count on project cards and detail pages with visual feedback.

## Acceptance Criteria
- [ ] Authenticated user can like a project (heart icon fills)
- [ ] Authenticated user can unlike a previously liked project
- [ ] Like count updates optimistically (instant feedback)
- [ ] Like state persists across page reloads
- [ ] Unauthenticated users see like count but clicking prompts login
- [ ] Like button shows filled heart if user has liked
- [ ] Denormalized `likesCount` on Project updates atomically
- [ ] Prevent duplicate likes (unique constraint on userId + projectId)

## Technical Notes
- API route: POST `/api/projects/[id]/like` (toggle)
- Prisma transaction: create/delete Like + increment/decrement likesCount
- Client-side optimistic update with revalidation
- Heart icon from Lucide React

## Design System Components
- **Like Button**: Heart outline (muted) → filled (primary green)
- Count in foreground text beside icon
- Scale pulse animation on toggle
- Disabled state for unauthenticated

## Test Coverage

| Test Range | Description | Count |
|------------|-------------|-------|
| TC-LIKE-001 to TC-LIKE-003 | Like Project | 3 |
| TC-LIKE-010 to TC-LIKE-011 | Unlike Project | 2 |
| TC-LIKE-020 to TC-LIKE-021 | Unauthenticated Users | 2 |
| TC-LIKE-030 to TC-LIKE-031 | Duplicate Prevention | 2 |
| TC-LIKE-040 | Like Count Accuracy | 1 |

See: [Test Cases](../test-specifications/startup-hub-test-cases.md#4-like-system)

## Prompt (use with feature-development)
Implement "Like System" for Startup Hub. Requirements:
- Toggle like API endpoint with Prisma transaction
- LikeButton client component with optimistic updates
- Auth check: redirect to login if unauthenticated
- Visual states: liked (filled green heart), unliked (outline)
Accept if AC met. See `design.md` for Like model, `design-system.md` for icon colors.
