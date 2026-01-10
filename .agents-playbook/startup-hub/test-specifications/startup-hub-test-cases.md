# Startup Hub - Test Cases Specification

**Version:** 1.0
**Date:** 2026-01-10
**Status:** Ready for Implementation

---

## Table of Contents

1. [Authentication System](#1-authentication-system)
2. [Project CRUD](#2-project-crud)
3. [Project Listing & Filtering](#3-project-listing--filtering)
4. [Like System](#4-like-system)
5. [API Token Management](#5-api-token-management)
6. [MCP API Endpoints](#6-mcp-api-endpoints)

---

## 1. Authentication System

### 1.1 User Registration

#### TC-AUTH-001: Successful registration with valid email and password
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User is not logged in, email is not already registered
- **Test Steps:**
  1. Navigate to `/auth/register`
  2. Enter valid email (e.g., `newuser@example.com`)
  3. Enter valid password (min 8 chars, at least 1 number, e.g., `Password1`)
  4. Confirm password
  5. Click "Register" button
- **Expected Result:**
  - User account is created
  - User is redirected to dashboard
  - Session cookie is set
  - Success toast/message displayed

#### TC-AUTH-002: Registration fails with already registered email
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Email `existing@example.com` already exists in database
- **Test Steps:**
  1. Navigate to `/auth/register`
  2. Enter `existing@example.com`
  3. Enter valid password
  4. Click "Register"
- **Expected Result:**
  - Error message: "Email already registered" or similar
  - User remains on registration page
  - No duplicate user created

#### TC-AUTH-003: Registration fails with invalid email format
- **Type:** Unit
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Attempt registration with emails: `invalid`, `@domain.com`, `user@`, `user@.com`
- **Expected Result:**
  - Validation error for invalid email format
  - Form submission blocked

#### TC-AUTH-004: Registration fails when password is less than 8 characters
- **Type:** Unit
- **Priority:** P0
- **Status:** **Implemented** (tests/unit/validation.test.ts)
- **Preconditions:** None
- **Test Steps:**
  1. Enter valid email
  2. Enter password with 7 or fewer characters (e.g., `Pass1`)
  3. Attempt to submit
- **Expected Result:**
  - Validation error: "Password must be at least 8 characters"
  - Form submission blocked

#### TC-AUTH-005: Registration fails when password has no number
- **Type:** Unit
- **Priority:** P0
- **Status:** **Implemented** (tests/unit/validation.test.ts)
- **Preconditions:** None
- **Test Steps:**
  1. Enter valid email
  2. Enter password without numbers (e.g., `PasswordOnly`)
  3. Attempt to submit
- **Expected Result:**
  - Validation error: "Password must contain at least 1 number"
  - Form submission blocked

#### TC-AUTH-006: Registration fails when passwords do not match
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Enter valid email
  2. Enter password `Password1`
  3. Enter confirm password `Password2`
  4. Attempt to submit
- **Expected Result:**
  - Validation error: "Passwords do not match"
  - Form submission blocked

#### TC-AUTH-007: Password field masks input
- **Type:** E2E
- **Priority:** P2
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Navigate to registration page
  2. Type in password field
- **Expected Result:**
  - Password input is masked (dots or asterisks)
  - Input type is "password"

---

### 1.2 User Login

#### TC-AUTH-010: Successful login with correct credentials
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User with email `user@example.com` and password `Password1` exists
- **Test Steps:**
  1. Navigate to `/auth/login`
  2. Enter `user@example.com`
  3. Enter `Password1`
  4. Click "Sign In"
- **Expected Result:**
  - User is redirected to dashboard
  - Session cookie is set
  - User name/avatar visible in header

#### TC-AUTH-011: Login fails with incorrect password
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User exists with different password
- **Test Steps:**
  1. Navigate to `/auth/login`
  2. Enter valid registered email
  3. Enter incorrect password
  4. Click "Sign In"
- **Expected Result:**
  - Error message: "Invalid credentials" (generic for security)
  - User remains on login page
  - No session created

#### TC-AUTH-012: Login fails with non-existent email
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Email `nonexistent@example.com` not in database
- **Test Steps:**
  1. Navigate to `/auth/login`
  2. Enter `nonexistent@example.com`
  3. Enter any password
  4. Click "Sign In"
- **Expected Result:**
  - Error message: "Invalid credentials" (same as wrong password for security)
  - User remains on login page

#### TC-AUTH-013: Login form prevents empty submission
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Navigate to `/auth/login`
  2. Leave email and password empty
  3. Click "Sign In"
- **Expected Result:**
  - Validation errors shown for required fields
  - Form not submitted

#### TC-AUTH-014: Login button shows loading state during authentication
- **Type:** E2E
- **Priority:** P2
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Navigate to `/auth/login`
  2. Enter valid credentials
  3. Click "Sign In"
  4. Observe button state
- **Expected Result:**
  - Button shows loading spinner or "Signing in..."
  - Button is disabled during request
  - Prevents double submission

---

### 1.3 Session Management

#### TC-AUTH-020: Session persists across page reloads
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User is logged in
- **Test Steps:**
  1. Verify user is logged in (dashboard accessible)
  2. Refresh the page (F5)
  3. Navigate to different pages
- **Expected Result:**
  - User remains logged in
  - Session cookie persists
  - No re-authentication required

#### TC-AUTH-021: Session persists across browser tabs
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User is logged in
- **Test Steps:**
  1. Open new browser tab
  2. Navigate to application
- **Expected Result:**
  - User is logged in in new tab
  - Same session shared across tabs

#### TC-AUTH-022: Logout clears session
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User is logged in
- **Test Steps:**
  1. Click logout button/link
  2. Attempt to access `/dashboard`
- **Expected Result:**
  - User is logged out
  - Session cookie cleared
  - Redirect to login page when accessing protected routes

---

### 1.4 Protected Routes

#### TC-AUTH-030: Unauthenticated user redirected from dashboard
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** No user session
- **Test Steps:**
  1. Clear all cookies
  2. Navigate directly to `/dashboard`
- **Expected Result:**
  - User redirected to `/auth/login`
  - Return URL preserved (optional: `?callbackUrl=/dashboard`)

#### TC-AUTH-031: Unauthenticated user redirected from dashboard/settings
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** No user session
- **Test Steps:**
  1. Navigate directly to `/dashboard/settings`
- **Expected Result:**
  - User redirected to `/auth/login`

#### TC-AUTH-032: Unauthenticated user redirected from dashboard/tokens
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** No user session
- **Test Steps:**
  1. Navigate directly to `/dashboard/tokens`
- **Expected Result:**
  - User redirected to `/auth/login`

#### TC-AUTH-033: Authenticated user can access dashboard
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User is logged in
- **Test Steps:**
  1. Navigate to `/dashboard`
- **Expected Result:**
  - Dashboard page loads successfully
  - User's projects displayed

---

### 1.5 OAuth Authentication

#### TC-AUTH-040: Google OAuth sign-in flow
- **Type:** E2E (Manual/Integration)
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Google OAuth configured
- **Test Steps:**
  1. Navigate to login page
  2. Click "Continue with Google"
  3. Complete Google authentication
- **Expected Result:**
  - User redirected to Google
  - After auth, redirected back to app
  - User session created
  - User profile synced from Google

#### TC-AUTH-041: LinkedIn OAuth sign-in flow
- **Type:** E2E (Manual/Integration)
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** LinkedIn OAuth configured
- **Test Steps:**
  1. Navigate to login page
  2. Click "Continue with LinkedIn"
  3. Complete LinkedIn authentication
- **Expected Result:**
  - User redirected to LinkedIn
  - After auth, redirected back to app
  - User session created

---

### 1.6 Locale on Auth Pages

#### TC-AUTH-050: Locale switcher works on login page
- **Type:** E2E
- **Priority:** P2
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Navigate to `/auth/login`
  2. Click locale switcher
  3. Select Russian (RU)
- **Expected Result:**
  - Page URL changes to `/ru/auth/login`
  - All text translated to Russian
  - Locale preference saved

---

## 2. Project CRUD

### 2.1 Create Project

#### TC-PROJ-001: Successfully create project with all required fields
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User is authenticated
- **Test Steps:**
  1. Navigate to dashboard
  2. Click "Create Project" button
  3. Fill in title: "My Startup"
  4. Fill in short description (up to 280 chars)
  5. Fill in pitch (up to 500 chars)
  6. Select status: "IDEA"
  7. Click "Save Project"
- **Expected Result:**
  - Project created successfully
  - Redirect to project detail or dashboard
  - Project appears in user's project list
  - Slug auto-generated (title + nanoid)

#### TC-PROJ-002: Successfully create project with all optional fields
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User is authenticated
- **Test Steps:**
  1. Click "Create Project"
  2. Fill all required fields
  3. Upload screenshot
  4. Add website URL
  5. Add tags: ["AI", "SaaS"]
  6. Set "Looking for": ["Developer", "Designer"]
  7. Enable "Needs Investment"
  8. Add investment details
  9. Add team members
  10. Set estimated launch date
  11. Click "Save Project"
- **Expected Result:**
  - Project created with all fields populated
  - Screenshot uploaded to Vercel Blob
  - All data persisted correctly

#### TC-PROJ-003: Create project fails without title
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User is authenticated
- **Test Steps:**
  1. Click "Create Project"
  2. Leave title empty
  3. Fill other required fields
  4. Click "Save Project"
- **Expected Result:**
  - Validation error: "Title is required"
  - Form not submitted

#### TC-PROJ-004: Short description enforces 280 character limit
- **Type:** Unit
- **Priority:** P1
- **Status:** **Implemented** (tests/unit/validation.test.ts)
- **Preconditions:** None
- **Test Steps:**
  1. Attempt to enter 281+ characters in short description
- **Expected Result:**
  - Input truncated or prevented at 280 chars
  - Character counter shows limit
  - Validation error if exceeded

#### TC-PROJ-005: Pitch enforces 500 character limit
- **Type:** Unit
- **Priority:** P1
- **Status:** **Implemented** (tests/unit/validation.test.ts)
- **Preconditions:** None
- **Test Steps:**
  1. Attempt to enter 501+ characters in pitch
- **Expected Result:**
  - Input truncated or prevented at 500 chars
  - Character counter shows limit
  - Validation error if exceeded

#### TC-PROJ-006: Slug auto-generated from title
- **Type:** Unit
- **Priority:** P1
- **Status:** **Implemented** (tests/unit/utils.test.ts)
- **Preconditions:** User is authenticated
- **Test Steps:**
  1. Create project with title "My Amazing Startup"
  2. Save project
- **Expected Result:**
  - Slug generated as `my-amazing-startup-{nanoid(6)}`
  - Slug is URL-safe (lowercase, hyphens)
  - Slug is unique

#### TC-PROJ-007: Screenshot upload works correctly
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User is authenticated
- **Test Steps:**
  1. Click "Create Project"
  2. Click upload zone or drag image file
  3. Select valid image (PNG, JPG)
- **Expected Result:**
  - Image preview displayed
  - File uploaded to Vercel Blob
  - URL stored with project

#### TC-PROJ-008: Screenshot upload rejects invalid file types
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User is authenticated
- **Test Steps:**
  1. Attempt to upload .txt, .pdf, or .exe file
- **Expected Result:**
  - Error message: "Only image files are allowed"
  - File not uploaded

#### TC-PROJ-009: Screenshot upload enforces size limit
- **Type:** E2E
- **Priority:** P2
- **Status:** Pending
- **Preconditions:** User is authenticated
- **Test Steps:**
  1. Attempt to upload image larger than limit (e.g., 10MB+)
- **Expected Result:**
  - Error message: "File size exceeds maximum"
  - File not uploaded

---

### 2.2 Edit Project

#### TC-PROJ-020: Successfully edit own project
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User is authenticated, user owns a project
- **Test Steps:**
  1. Navigate to dashboard
  2. Click "Edit" on own project
  3. Change title to "Updated Startup Name"
  4. Change status to "MVP"
  5. Click "Save"
- **Expected Result:**
  - Changes saved successfully
  - Project detail reflects updates
  - `updatedAt` timestamp updated

#### TC-PROJ-021: Cannot edit another user's project
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User A logged in, Project belongs to User B
- **Test Steps:**
  1. Attempt to navigate to edit URL for User B's project
  2. OR attempt API call to PUT /api/projects/{id}
- **Expected Result:**
  - 403 Forbidden error
  - "You don't have permission to edit this project"

#### TC-PROJ-022: Edit project form pre-fills existing data
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User owns a project with all fields filled
- **Test Steps:**
  1. Click "Edit" on project
- **Expected Result:**
  - All existing data pre-populated in form
  - Screenshot preview shown
  - Tags, team members displayed

#### TC-PROJ-023: Slug does not change on edit
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Project exists with slug "my-startup-abc123"
- **Test Steps:**
  1. Edit project, change title
  2. Save
- **Expected Result:**
  - Slug remains unchanged
  - URLs to project still work

---

### 2.3 Delete Project

#### TC-PROJ-030: Successfully delete own project with confirmation
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User is authenticated, user owns a project
- **Test Steps:**
  1. Navigate to dashboard
  2. Click "Delete" on own project
  3. Confirm deletion in modal
- **Expected Result:**
  - Project deleted from database
  - Project no longer appears in dashboard
  - Project no longer appears in public listing
  - Associated likes deleted (cascade)

#### TC-PROJ-031: Delete cancelled when user clicks cancel in confirmation
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User is authenticated, user owns a project
- **Test Steps:**
  1. Click "Delete" on own project
  2. Click "Cancel" in confirmation modal
- **Expected Result:**
  - Project not deleted
  - Modal closes
  - Project still visible

#### TC-PROJ-032: Cannot delete another user's project
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User A logged in, Project belongs to User B
- **Test Steps:**
  1. Attempt API call to DELETE /api/projects/{id}
- **Expected Result:**
  - 403 Forbidden error
  - Project not deleted

---

### 2.4 Dashboard View

#### TC-PROJ-040: Dashboard shows only user's own projects
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User A has 3 projects, User B has 2 projects, User A logged in
- **Test Steps:**
  1. Navigate to `/dashboard`
- **Expected Result:**
  - Only User A's 3 projects displayed
  - User B's projects not visible

#### TC-PROJ-041: Dashboard shows status badges correctly
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User has projects with different statuses
- **Test Steps:**
  1. Navigate to dashboard
  2. Check status badges
- **Expected Result:**
  - IDEA shows default badge
  - MVP shows appropriate badge
  - LAUNCHED shows success badge
  - PAUSED shows warning badge

#### TC-PROJ-042: Dashboard empty state when no projects
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User has no projects
- **Test Steps:**
  1. Navigate to dashboard
- **Expected Result:**
  - Empty state message displayed
  - CTA to create first project

---

### 2.5 Project Detail Page

#### TC-PROJ-050: Project detail page displays all fields
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Project exists with all fields filled
- **Test Steps:**
  1. Navigate to `/projects/{slug}`
- **Expected Result:**
  - Title, description, pitch displayed
  - Screenshot shown
  - Status badge visible
  - Tags displayed as chips
  - Team members listed
  - "Looking for" roles shown
  - Investment details visible if enabled
  - Like count and button visible

#### TC-PROJ-051: Project detail page handles missing optional fields
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Project exists with only required fields
- **Test Steps:**
  1. Navigate to project detail page
- **Expected Result:**
  - Page renders without errors
  - Missing sections gracefully hidden
  - No "undefined" or empty containers

#### TC-PROJ-052: Non-existent project shows 404
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Navigate to `/projects/non-existent-slug-xyz`
- **Expected Result:**
  - 404 Not Found page displayed
  - Helpful message and link to homepage

---

## 3. Project Listing & Filtering

### 3.1 Homepage Display

#### TC-LIST-001: Homepage displays project cards in grid
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** At least 5 projects exist in database
- **Test Steps:**
  1. Navigate to homepage `/`
- **Expected Result:**
  - Project cards displayed in responsive grid
  - 2 columns on tablet
  - 3 columns on desktop
  - Cards show: screenshot, title, description, tags, status, likes

#### TC-LIST-002: Project card displays all required information
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Project exists with all fields
- **Test Steps:**
  1. View project card on homepage
- **Expected Result:**
  - Screenshot (or placeholder)
  - Title truncated if too long
  - Short description
  - Tags (limited display, +N more)
  - Team size indicator
  - "Looking for" roles
  - Status badge
  - Like count with heart icon

#### TC-LIST-003: Homepage shows empty state when no projects
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Database has no projects
- **Test Steps:**
  1. Navigate to homepage
- **Expected Result:**
  - Empty state message displayed
  - CTA for creating project (if logged in)
  - Helpful message for discovering content

---

### 3.2 Search Functionality

#### TC-LIST-010: Search filters by title
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Projects exist with titles "Alpha Project", "Beta Startup", "Gamma App"
- **Test Steps:**
  1. Type "Alpha" in search input
  2. Wait for debounce
- **Expected Result:**
  - Only "Alpha Project" displayed
  - Other projects hidden

#### TC-LIST-011: Search filters by description
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Project with description containing "machine learning"
- **Test Steps:**
  1. Search for "machine learning"
- **Expected Result:**
  - Projects with matching description displayed

#### TC-LIST-012: Search is case-insensitive
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Project with title "MyStartup"
- **Test Steps:**
  1. Search for "mystartup"
  2. Search for "MYSTARTUP"
- **Expected Result:**
  - Project found in both cases

#### TC-LIST-013: Search debounces input
- **Type:** E2E
- **Priority:** P2
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Type "test" quickly character by character
  2. Monitor network requests
- **Expected Result:**
  - API called only once after typing stops
  - No request per character

#### TC-LIST-014: Search shows no results message
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Search for "xyznonexistent123"
- **Expected Result:**
  - "No projects found" message displayed
  - Suggestion to adjust search or filters

---

### 3.3 Filter by Status

#### TC-LIST-020: Filter by IDEA status
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Projects exist with different statuses
- **Test Steps:**
  1. Select "IDEA" from status filter
- **Expected Result:**
  - Only IDEA projects displayed
  - URL updated with `?status=IDEA`

#### TC-LIST-021: Filter by multiple statuses
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Projects exist with various statuses
- **Test Steps:**
  1. Select "MVP" and "BETA" statuses
- **Expected Result:**
  - MVP and BETA projects displayed
  - IDEA, LAUNCHED, PAUSED hidden

#### TC-LIST-022: Clear status filter
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Status filter is active
- **Test Steps:**
  1. Click "Clear" or deselect all statuses
- **Expected Result:**
  - All projects displayed
  - URL param removed

---

### 3.4 Filter by Looking For Roles

#### TC-LIST-030: Filter by "Developer" role
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Some projects looking for developers, others not
- **Test Steps:**
  1. Select "Developer" from roles filter
- **Expected Result:**
  - Only projects with "Developer" in lookingFor array displayed
  - URL updated with filter param

#### TC-LIST-031: Filter by multiple roles (OR logic)
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Projects looking for different roles
- **Test Steps:**
  1. Select "Developer" and "Designer"
- **Expected Result:**
  - Projects looking for Developer OR Designer displayed

---

### 3.5 Filter by Investment

#### TC-LIST-040: Filter by "Needs Investment" toggle
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Mix of projects with needsInvestment true/false
- **Test Steps:**
  1. Enable "Needs Investment" toggle
- **Expected Result:**
  - Only projects with needsInvestment=true displayed
  - URL updated

---

### 3.6 Filter by Tags

#### TC-LIST-050: Filter by single tag
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Projects with tags ["AI", "SaaS", "FinTech"]
- **Test Steps:**
  1. Select "AI" tag
- **Expected Result:**
  - Only projects with "AI" tag displayed

#### TC-LIST-051: Filter by multiple tags (AND logic)
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Project A: ["AI", "SaaS"], Project B: ["AI"], Project C: ["SaaS"]
- **Test Steps:**
  1. Select "AI" and "SaaS" tags
- **Expected Result:**
  - Only Project A displayed (has both tags)

---

### 3.7 Sorting

#### TC-LIST-060: Sort by newest (default)
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Projects with different createdAt dates
- **Test Steps:**
  1. Load homepage
- **Expected Result:**
  - Projects ordered by createdAt DESC
  - Most recent first

#### TC-LIST-061: Sort by oldest
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Projects with different createdAt dates
- **Test Steps:**
  1. Select "Oldest" sort option
- **Expected Result:**
  - Projects ordered by createdAt ASC
  - Oldest first
  - URL updated with `?sort=oldest`

#### TC-LIST-062: Sort by most liked
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Projects with different like counts
- **Test Steps:**
  1. Select "Most Liked" sort option
- **Expected Result:**
  - Projects ordered by likesCount DESC
  - Most liked first

---

### 3.8 Pagination

#### TC-LIST-070: Infinite scroll loads more projects
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** 50+ projects exist
- **Test Steps:**
  1. Navigate to homepage (shows 20 projects)
  2. Scroll to bottom
- **Expected Result:**
  - Next 20 projects loaded
  - Smooth append to grid
  - Loading indicator shown during fetch

#### TC-LIST-071: Pagination preserves filters
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** 30+ IDEA status projects exist
- **Test Steps:**
  1. Filter by IDEA status
  2. Scroll to load more
- **Expected Result:**
  - Additional IDEA projects loaded
  - No MVP/BETA projects appear

#### TC-LIST-072: End of results indication
- **Type:** E2E
- **Priority:** P2
- **Status:** Pending
- **Preconditions:** Fewer than 20 projects
- **Test Steps:**
  1. Navigate to homepage
  2. Scroll down
- **Expected Result:**
  - No "Load more" or infinite scroll trigger
  - Optional: "No more projects" message

---

### 3.9 URL State Persistence

#### TC-LIST-080: Filters persist in URL
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Apply filters: status=MVP, tags=AI, sort=oldest
  2. Copy URL
  3. Open in new tab
- **Expected Result:**
  - Filters applied automatically
  - Same results displayed
  - Filter UI reflects URL params

#### TC-LIST-081: Shareable filter URLs
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Apply filters
  2. Share URL to another user
- **Expected Result:**
  - Other user sees same filtered view
  - No authentication required for viewing

---

### 3.10 Combined Filters

#### TC-LIST-090: Multiple filters work together
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Diverse project dataset
- **Test Steps:**
  1. Search for "startup"
  2. Filter status: MVP
  3. Filter role: Developer
  4. Enable needs investment
  5. Sort by most liked
- **Expected Result:**
  - All filters combined with AND logic
  - Only matching projects displayed
  - Results sorted correctly

---

## 4. Like System

### 4.1 Like Project

#### TC-LIKE-001: Authenticated user can like a project
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User is authenticated, project exists with 0 likes
- **Test Steps:**
  1. Navigate to project card or detail page
  2. Click heart/like button
- **Expected Result:**
  - Heart icon fills/changes color to green
  - Like count increments (0 -> 1)
  - Like persisted to database
  - Optimistic UI update (instant feedback)

#### TC-LIKE-002: Like count updates optimistically
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User is authenticated
- **Test Steps:**
  1. Click like button
  2. Observe UI immediately
- **Expected Result:**
  - Count updates instantly (before API response)
  - No loading spinner on like button
  - If API fails, count rolls back

#### TC-LIKE-003: Like persists across page reload
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User liked a project
- **Test Steps:**
  1. Refresh page
  2. Check like button state
- **Expected Result:**
  - Heart icon still filled
  - Like count unchanged
  - Like state retrieved from database

---

### 4.2 Unlike Project

#### TC-LIKE-010: Authenticated user can unlike a project
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User has already liked the project
- **Test Steps:**
  1. Click filled heart/like button
- **Expected Result:**
  - Heart icon unfills (outline only)
  - Like count decrements
  - Like record deleted from database

#### TC-LIKE-011: Unlike prevents negative counts
- **Type:** Unit
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Project with 1 like
- **Test Steps:**
  1. Unlike the project
  2. Attempt to unlike again (if UI allows)
- **Expected Result:**
  - Count cannot go below 0
  - No database constraint violation

---

### 4.3 Unauthenticated Users

#### TC-LIKE-020: Unauthenticated user sees like count
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Not logged in, project has 5 likes
- **Test Steps:**
  1. Navigate to homepage or project detail
- **Expected Result:**
  - Like count (5) is visible
  - Heart icon shown (outline)

#### TC-LIKE-021: Unauthenticated user prompted to login on like attempt
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Not logged in
- **Test Steps:**
  1. Click like button
- **Expected Result:**
  - Redirect to login page
  - OR modal prompting login
  - Project not liked

---

### 4.4 Duplicate Prevention

#### TC-LIKE-030: User cannot like same project twice
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User already liked project
- **Test Steps:**
  1. Attempt to call POST /api/projects/{id}/like again
  2. Or manipulate UI to send duplicate request
- **Expected Result:**
  - No duplicate like created
  - Database unique constraint enforced
  - Count remains accurate

#### TC-LIKE-031: Rapid clicking does not create duplicates
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User authenticated
- **Test Steps:**
  1. Rapidly click like button 5 times
- **Expected Result:**
  - Button debounced or disabled during request
  - Only one like/unlike action processed
  - Final state is toggled once

---

### 4.5 Like Count Accuracy

#### TC-LIKE-040: Denormalized likesCount matches actual likes
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Create project
  2. Have 3 users like it
  3. Query project.likesCount
  4. Query COUNT of Like records
- **Expected Result:**
  - Both values equal 3
  - Atomic update ensures consistency

---

## 5. API Token Management

### 5.1 Generate Token

#### TC-TOKEN-001: Successfully generate new API token
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User is authenticated, has fewer than 10 tokens
- **Test Steps:**
  1. Navigate to `/dashboard/tokens`
  2. Click "Generate New Token"
  3. Enter token name: "My AI Agent"
  4. Select permissions
  5. Click "Generate"
- **Expected Result:**
  - Token generated and displayed once in success banner
  - Token format: `sh_live_` + 32 random characters
  - Copy button functional
  - Token stored as bcrypt hash (cannot retrieve later)

#### TC-TOKEN-002: Token displayed only once
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Token just generated
- **Test Steps:**
  1. Close success banner or navigate away
  2. Return to tokens page
- **Expected Result:**
  - Plain text token no longer visible
  - Only masked/hidden representation shown
  - Message: "Token value cannot be retrieved"

#### TC-TOKEN-003: Token copy button works
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Token just generated, displayed in banner
- **Test Steps:**
  1. Click "Copy" button
  2. Paste in text editor
- **Expected Result:**
  - Full token copied to clipboard
  - Visual feedback (checkmark, "Copied!")

#### TC-TOKEN-004: Cannot generate more than 10 tokens
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User has exactly 10 active tokens
- **Test Steps:**
  1. Attempt to generate new token
- **Expected Result:**
  - Error message: "Maximum 10 tokens allowed"
  - Generate button disabled or shows warning
  - No new token created

#### TC-TOKEN-005: Token name is required
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Click "Generate New Token"
  2. Leave name empty
  3. Click "Generate"
- **Expected Result:**
  - Validation error: "Token name is required"
  - Token not generated

---

### 5.2 Token Table Display

#### TC-TOKEN-010: Token table shows all user tokens
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User has 3 tokens
- **Test Steps:**
  1. Navigate to `/dashboard/tokens`
- **Expected Result:**
  - Table displays all 3 tokens
  - Columns: Name, Status, Created, Last Used, Actions

#### TC-TOKEN-011: Token status badges displayed correctly
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User has active and revoked tokens
- **Test Steps:**
  1. View token table
- **Expected Result:**
  - Active tokens show green "Active" badge
  - Revoked tokens show red "Revoked" badge

#### TC-TOKEN-012: Last used timestamp updates
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Token exists, never used
- **Test Steps:**
  1. Note "Last Used" shows "Never" or "-"
  2. Make API call with token
  3. Refresh token table
- **Expected Result:**
  - "Last Used" shows recent timestamp
  - Updates on each API call

#### TC-TOKEN-013: Empty state when no tokens
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User has no tokens
- **Test Steps:**
  1. Navigate to tokens page
- **Expected Result:**
  - Empty state message
  - CTA to generate first token
  - Developer quickstart visible

---

### 5.3 Revoke Token

#### TC-TOKEN-020: Successfully revoke a token
- **Type:** E2E
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User has active token
- **Test Steps:**
  1. Click delete/revoke icon on token row
  2. Confirm in modal
- **Expected Result:**
  - Token status changes to "Revoked"
  - Token no longer works for API auth
  - Row shows revoked badge

#### TC-TOKEN-021: Revoke cancelled on modal dismiss
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User has active token
- **Test Steps:**
  1. Click revoke
  2. Click "Cancel" in confirmation modal
- **Expected Result:**
  - Token not revoked
  - Status remains "Active"

#### TC-TOKEN-022: Cannot revoke already revoked token
- **Type:** E2E
- **Priority:** P2
- **Status:** Pending
- **Preconditions:** Token is already revoked
- **Test Steps:**
  1. Attempt to revoke again
- **Expected Result:**
  - Revoke button disabled or hidden
  - No action taken

---

### 5.4 Token Security

#### TC-TOKEN-030: Token stored as bcrypt hash
- **Type:** Unit
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Token generated
- **Test Steps:**
  1. Query database for APIToken record
  2. Examine tokenHash field
- **Expected Result:**
  - tokenHash is bcrypt hash (starts with $2b$ or $2a$)
  - Original token not stored anywhere

#### TC-TOKEN-031: Token prefix format correct
- **Type:** Unit
- **Priority:** P1
- **Status:** **Implemented** (tests/unit/utils.test.ts)
- **Preconditions:** None
- **Test Steps:**
  1. Generate token
  2. Check format
- **Expected Result:**
  - Starts with `sh_live_`
  - Followed by 32 alphanumeric characters

---

## 6. MCP API Endpoints

### 6.1 Authentication

#### TC-MCP-001: Valid token authenticates successfully
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User has active API token
- **Test Steps:**
  1. Call `GET /api/mcp/projects` with header `Authorization: Bearer sh_live_xxx`
- **Expected Result:**
  - 200 OK response
  - User's projects returned

#### TC-MCP-002: Invalid token returns 401
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Call `GET /api/mcp/projects` with `Authorization: Bearer invalid_token`
- **Expected Result:**
  - 401 Unauthorized
  - JSON error: `{"error": "Invalid or expired token"}`

#### TC-MCP-003: Missing Authorization header returns 401
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Call `GET /api/mcp/projects` without Authorization header
- **Expected Result:**
  - 401 Unauthorized
  - JSON error: `{"error": "Authorization header required"}`

#### TC-MCP-004: Revoked token returns 401
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Token has been revoked
- **Test Steps:**
  1. Call API with revoked token
- **Expected Result:**
  - 401 Unauthorized
  - Token no longer valid

#### TC-MCP-005: lastUsedAt updated on API call
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Token exists
- **Test Steps:**
  1. Note current lastUsedAt value
  2. Make API call with token
  3. Check lastUsedAt
- **Expected Result:**
  - lastUsedAt updated to current timestamp

---

### 6.2 CRUD Operations

#### TC-MCP-010: POST /api/mcp/projects creates project
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Valid token with "create" permission
- **Test Steps:**
  1. POST to `/api/mcp/projects` with JSON body:
     ```json
     {
       "title": "AI Assistant",
       "shortDescription": "An AI-powered assistant",
       "pitch": "Revolutionizing productivity",
       "status": "IDEA"
     }
     ```
- **Expected Result:**
  - 201 Created
  - Project created and returned with id, slug
  - Project visible in user's dashboard

#### TC-MCP-011: GET /api/mcp/projects lists user's projects
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** User has 3 projects
- **Test Steps:**
  1. GET `/api/mcp/projects`
- **Expected Result:**
  - 200 OK
  - Array of user's 3 projects
  - Does not include other users' projects

#### TC-MCP-012: GET /api/mcp/projects/[id] returns project detail
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Project exists owned by user
- **Test Steps:**
  1. GET `/api/mcp/projects/{projectId}`
- **Expected Result:**
  - 200 OK
  - Full project object returned

#### TC-MCP-013: PUT /api/mcp/projects/[id] updates project
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Project exists owned by user, token has "update" permission
- **Test Steps:**
  1. PUT `/api/mcp/projects/{id}` with updated fields
- **Expected Result:**
  - 200 OK
  - Project updated
  - Updated fields reflected in response

#### TC-MCP-014: DELETE /api/mcp/projects/[id] deletes project
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Project exists owned by user, token has "delete" permission
- **Test Steps:**
  1. DELETE `/api/mcp/projects/{id}`
- **Expected Result:**
  - 200 OK or 204 No Content
  - Project deleted from database

#### TC-MCP-015: Cannot access other user's project
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Project belongs to different user
- **Test Steps:**
  1. GET `/api/mcp/projects/{otherUsersProjectId}`
- **Expected Result:**
  - 404 Not Found
  - Does not reveal project exists

---

### 6.3 Permissions

#### TC-MCP-020: Read-only token can list projects
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Token with only ["read"] permission
- **Test Steps:**
  1. GET `/api/mcp/projects`
- **Expected Result:**
  - 200 OK
  - Projects returned

#### TC-MCP-021: Read-only token cannot create project
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Token with only ["read"] permission
- **Test Steps:**
  1. POST `/api/mcp/projects` with valid body
- **Expected Result:**
  - 403 Forbidden
  - `{"error": "Insufficient permissions"}`

#### TC-MCP-022: Read-only token cannot update project
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Token with only ["read"] permission
- **Test Steps:**
  1. PUT `/api/mcp/projects/{id}`
- **Expected Result:**
  - 403 Forbidden

#### TC-MCP-023: Read-only token cannot delete project
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Token with only ["read"] permission
- **Test Steps:**
  1. DELETE `/api/mcp/projects/{id}`
- **Expected Result:**
  - 403 Forbidden

#### TC-MCP-024: Full permission token can perform all operations
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Token with ["read", "create", "update", "delete"] permissions
- **Test Steps:**
  1. Create, read, update, delete project
- **Expected Result:**
  - All operations succeed

---

### 6.4 Rate Limiting

#### TC-MCP-030: Rate limit of 100 requests per minute
- **Type:** Unit
- **Priority:** P0
- **Status:** **Implemented** (tests/unit/utils.test.ts)
- **Preconditions:** Valid token
- **Test Steps:**
  1. Make 100 requests rapidly
  2. Make 101st request
- **Expected Result:**
  - First 100 requests succeed
  - 101st request returns 429 Too Many Requests
  - Response includes retry-after header

#### TC-MCP-031: Rate limit resets after window
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Rate limit reached
- **Test Steps:**
  1. Wait 60 seconds
  2. Make request
- **Expected Result:**
  - Request succeeds
  - Rate limit counter reset

#### TC-MCP-032: Rate limit is per token
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** User has two tokens
- **Test Steps:**
  1. Exhaust rate limit on Token A
  2. Make request with Token B
- **Expected Result:**
  - Token B request succeeds
  - Each token has independent limit

---

### 6.5 Request Validation

#### TC-MCP-040: Create project validates required fields
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Preconditions:** Valid token with create permission
- **Test Steps:**
  1. POST `/api/mcp/projects` with empty body `{}`
- **Expected Result:**
  - 400 Bad Request
  - Validation errors for missing required fields

#### TC-MCP-041: Create project validates field lengths
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Valid token
- **Test Steps:**
  1. POST with shortDescription > 280 chars
- **Expected Result:**
  - 400 Bad Request
  - `{"error": "shortDescription must be 280 characters or less"}`

#### TC-MCP-042: Invalid status value rejected
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** Valid token
- **Test Steps:**
  1. POST with `"status": "INVALID"`
- **Expected Result:**
  - 400 Bad Request
  - `{"error": "Invalid status value"}`

---

### 6.6 Error Format Consistency

#### TC-MCP-050: All errors return consistent JSON format
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Preconditions:** None
- **Test Steps:**
  1. Trigger 400 error
  2. Trigger 401 error
  3. Trigger 403 error
  4. Trigger 404 error
  5. Trigger 429 error
- **Expected Result:**
  - All errors return JSON with consistent structure
  - Format: `{"error": "message", "code": "ERROR_CODE"}`

---

## Edge Cases & Boundary Conditions

### EC-001: Unicode characters in project title
- **Type:** Integration
- **Priority:** P2
- **Status:** Pending
- **Test:** Create project with title containing emoji, Chinese, Arabic characters
- **Expected:** Title saved and displayed correctly, slug generated safely

### EC-002: SQL injection prevention
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Test:** Attempt `'; DROP TABLE projects; --` in title field
- **Expected:** Input escaped, no SQL executed, project created with literal string

### EC-003: XSS prevention in project content
- **Type:** Integration
- **Priority:** P0
- **Status:** Pending
- **Test:** Enter `<script>alert('xss')</script>` in description
- **Expected:** Script tags escaped or stripped, not executed

### EC-004: Very long API token in header
- **Type:** Integration
- **Priority:** P2
- **Status:** Pending
- **Test:** Send Authorization header with 10KB string
- **Expected:** Graceful rejection, no server crash

### EC-005: Concurrent like requests
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Test:** Send 10 simultaneous like requests for same project/user
- **Expected:** Only one like created, correct count

### EC-006: Project with maximum tags
- **Type:** Integration
- **Priority:** P2
- **Status:** Pending
- **Test:** Create project with 20+ tags
- **Expected:** Either accepted or validation error with clear limit

### EC-007: Network failure during file upload
- **Type:** E2E
- **Priority:** P2
- **Status:** Pending
- **Test:** Start upload, disconnect network
- **Expected:** Error message, form still usable, can retry

### EC-008: Session expiry during form submission
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Test:** Start filling form, wait for session to expire, submit
- **Expected:** Redirect to login with form data preserved (if possible)

### EC-009: Empty search results with active filters
- **Type:** E2E
- **Priority:** P1
- **Status:** Pending
- **Test:** Apply highly restrictive filter combination
- **Expected:** Empty state with suggestions to broaden search

### EC-010: API request with expired token
- **Type:** Integration
- **Priority:** P1
- **Status:** Pending
- **Test:** Set token expiresAt to past date, make request
- **Expected:** 401 Unauthorized, clear expiry message

---

## Test Coverage Summary

| Feature | P0 Tests | P1 Tests | P2 Tests | Total |
|---------|----------|----------|----------|-------|
| Authentication | 13 | 8 | 3 | 24 |
| Project CRUD | 10 | 9 | 1 | 20 |
| Project Listing | 11 | 10 | 2 | 23 |
| Like System | 7 | 4 | 0 | 11 |
| API Tokens | 5 | 5 | 1 | 11 |
| MCP API | 13 | 8 | 0 | 21 |
| Edge Cases | 2 | 3 | 5 | 10 |
| **Total** | **61** | **47** | **12** | **120** |

---

## Implementation Priority

### Phase 1: Critical Path (P0)
Implement all P0 tests first. These cover core functionality and security requirements.

### Phase 2: Important Scenarios (P1)
Implement P1 tests after P0 passes. These cover important user flows and edge cases.

### Phase 3: Nice-to-Have (P2)
Implement P2 tests as time permits. These cover polish and minor edge cases.

---

## Testing Tools Recommendation

| Test Type | Tool | Notes |
|-----------|------|-------|
| E2E | Playwright | Cross-browser, visual testing |
| Integration | Vitest + supertest | API route testing |
| Unit | Vitest | Pure functions, validation |
| Mocking | MSW | API mocking for E2E |
| Database | Docker Postgres | Isolated test database |
