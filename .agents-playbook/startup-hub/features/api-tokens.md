---
feature: API Token Management
slug: api-tokens
phase: 4-integration
status: planned
priority: high
estimated_effort: l
---

# API Token Management

## Description
Dashboard interface for generating, viewing, and revoking API tokens used for MCP authentication. Tokens are displayed once on creation and stored as bcrypt hashes. Includes usage tracking and expiration.

## Acceptance Criteria
- [ ] User can generate new API token with custom name
- [ ] Token displayed once in success banner (copy button)
- [ ] Token stored as bcrypt hash (never retrievable)
- [ ] Token table shows: name, status, created date, last used, actions
- [ ] User can revoke (delete) a token
- [ ] Revoked tokens show "Revoked" status badge
- [ ] Tokens show "last used" timestamp (updated on API call)
- [ ] Developer quickstart section with curl example
- [ ] Token prefix: `sh_live_` for identification
- [ ] Maximum 10 active tokens per user

## Technical Notes
- API routes: POST/GET/DELETE `/api/tokens`
- bcrypt with 12 rounds for hashing
- Token format: `sh_live_` + nanoid(32)

## Design System Components
- **Sidebar**: Active item with green left border
- **Breadcrumbs**: Dashboard > Settings > API Tokens
- **Alert Success**: Green left border, checkmark, token display
- **Code Block**: Terminal style with syntax highlighting
- **Table**: Uppercase headers, row borders, hover state
- **Badges**: Success (Active), Error (Revoked)
- **Button Primary**: Green "Generate New Token"
- **Button Secondary**: Outlined "View Docs"
- **Button Ghost**: Trash icon for delete

## Test Coverage

| Test Range | Description | Count |
|------------|-------------|-------|
| TC-TOKEN-001 to TC-TOKEN-005 | Generate Token | 5 |
| TC-TOKEN-010 to TC-TOKEN-013 | Token Table Display | 4 |
| TC-TOKEN-020 to TC-TOKEN-022 | Revoke Token | 3 |
| TC-TOKEN-030 to TC-TOKEN-031 | Token Security | 2 |

See: [Test Cases](../test-specifications/startup-hub-test-cases.md#5-api-token-management)

## Prompt (use with feature-development)
Implement "API Token Management" for Startup Hub. Requirements:
- Dashboard tokens page per `api-token.png` mockup
- Token generation with bcrypt hashing, one-time display
- Token table with status badges, last used tracking
- Revoke functionality with confirmation
Accept if AC met. See `design.md` for APIToken model, `design-system.md` for Table/Badge.
