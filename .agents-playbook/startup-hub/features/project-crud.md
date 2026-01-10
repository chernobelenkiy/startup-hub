---
feature: Project CRUD
slug: project-crud
phase: 2-core
status: planned
priority: high
estimated_effort: xl
---

# Project CRUD

## Description
Full create, read, update, delete operations for startup projects. Includes form with rich editor for pitch, image upload, team members management, tags, and status selection. Dashboard view for managing own projects.

## Acceptance Criteria
- [ ] Authenticated user can create a new project via modal form
- [ ] Project form includes: title, short description (280 chars), pitch (500 chars), screenshot upload, status, tags, team members, looking for roles, investment details
- [ ] Screenshot uploads to Vercel Blob with preview
- [ ] Slug auto-generated from title + nanoid(6)
- [ ] User can edit their own projects
- [ ] User can delete their own projects (with confirmation)
- [ ] Dashboard shows list of user's projects with status badges
- [ ] Form validation with Zod schemas
- [ ] Project detail page displays all fields per `startup-details.png`

## Technical Notes
- API routes: POST/GET/PUT/DELETE `/api/projects`
- Vercel Blob for image uploads (presigned URLs)
- Prisma transactions for atomic operations

## Design System Components
- **Modal/Dialog**: Dark surface, 640px max-width for form
- **Input**: Elevated surface, green focus ring
- **Select/Dropdown**: Chevron trigger, elevated menu
- **Tag Input**: Green chips with × remove button
- **File Upload Zone**: Dashed border, upload icon, drag-drop
- **Button Primary**: Green "Save Project"
- **Button Secondary**: Outlined "Cancel"
- **Badges**: Status badges (IDEA, MVP, BETA, LAUNCHED, PAUSED)

## Test Coverage

| Test Range | Description | Count |
|------------|-------------|-------|
| TC-PROJ-001 to TC-PROJ-009 | Create Project | 9 |
| TC-PROJ-020 to TC-PROJ-023 | Edit Project | 4 |
| TC-PROJ-030 to TC-PROJ-032 | Delete Project | 3 |
| TC-PROJ-040 to TC-PROJ-042 | Dashboard View | 3 |
| TC-PROJ-050 to TC-PROJ-052 | Project Detail Page | 3 |

See: [Test Cases](../test-specifications/startup-hub-test-cases.md#2-project-crud)

## Prompt (use with feature-development)
Implement "Project CRUD" for Startup Hub. Requirements:
- Dashboard page listing user's projects with create/edit/delete
- Project form modal per `user-dashboard.png` mockup
- API routes with Zod validation, Prisma queries
- Vercel Blob integration for screenshot uploads
- Project detail page per `startup-details.png`
Accept if AC met. See `design.md` for Prisma schema, `design-system.md` for components.
