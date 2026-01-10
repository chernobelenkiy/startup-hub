---
feature: Authentication System
slug: auth-system
phase: 1-foundation
status: planned
priority: high
estimated_effort: l
---

# Authentication System

## Description
Complete authentication flow with NextAuth.js supporting email/password and OAuth providers (Google, LinkedIn). Includes session management, protected routes, and locale-aware auth pages matching the dark theme design.

## Acceptance Criteria
- [ ] User can register with email/password
- [ ] User can sign in with email/password
- [ ] User can sign in with Google OAuth
- [ ] User can sign in with LinkedIn OAuth
- [ ] Session persists across page reloads (JWT strategy)
- [ ] Protected routes redirect to `/auth/login` if unauthenticated
- [ ] Auth pages match design mockup (dark modal, green CTA, social buttons)
- [ ] Locale switcher works on auth pages
- [ ] Password validation (min 8 chars, 1 number)
- [ ] Error states displayed for invalid credentials

## Technical Notes
- NextAuth.js v5 (Auth.js) with JWT strategy
- Prisma adapter for user persistence
- Middleware protection for `/dashboard/*` routes

## Design System Components
- **Modal/Dialog**: Dark surface, 480px max-width
- **Tabs**: Underline style with green active indicator
- **Social Auth Buttons**: Dark elevated surface, provider icons
- **Input**: Elevated surface background, green focus ring
- **Button Primary**: Green background, black text
- **Locale Switcher**: Globe icon dropdown, top-right
- **Links**: Green for "Forgot Password?", muted for terms

## Test Coverage

| Test Range | Description | Count |
|------------|-------------|-------|
| TC-AUTH-001 to TC-AUTH-007 | User Registration | 7 |
| TC-AUTH-010 to TC-AUTH-014 | User Login | 5 |
| TC-AUTH-020 to TC-AUTH-022 | Session Management | 3 |
| TC-AUTH-030 to TC-AUTH-033 | Protected Routes | 4 |
| TC-AUTH-040 to TC-AUTH-041 | OAuth Authentication | 2 |
| TC-AUTH-050 | Locale Support | 1 |

See: [Test Cases](../test-specifications/startup-hub-test-cases.md#1-authentication-system)

## Prompt (use with feature-development)
Implement "Authentication System" for Startup Hub. Requirements:
- NextAuth.js v5 with credentials + Google + LinkedIn providers
- JWT session strategy, Prisma adapter
- Auth modal UI per `auth.png` mockup (dark theme, green buttons)
- Middleware for route protection on `/dashboard/*`
Accept if AC met. See `design.md` for architecture, `design-system.md` for tokens.
