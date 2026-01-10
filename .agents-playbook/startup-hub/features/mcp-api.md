---
feature: MCP API Endpoints
slug: mcp-api
phase: 4-integration
status: planned
priority: high
estimated_effort: l
---

# MCP API Endpoints

## Description
RESTful API endpoints for AI agents to manage projects programmatically. Authenticated via Bearer tokens with rate limiting. Enables create, read, update, delete operations on user's projects.

## Acceptance Criteria
- [ ] `POST /api/mcp/projects` - Create new project
- [ ] `GET /api/mcp/projects` - List user's projects
- [ ] `GET /api/mcp/projects/[id]` - Get project details
- [ ] `PUT /api/mcp/projects/[id]` - Update project
- [ ] `DELETE /api/mcp/projects/[id]` - Delete project
- [ ] All endpoints require `Authorization: Bearer <token>` header
- [ ] Invalid/expired tokens return 401 Unauthorized
- [ ] Token permissions enforced (read/create/update/delete)
- [ ] Rate limited: 100 requests/minute per token
- [ ] Request/response validation with Zod
- [ ] `lastUsedAt` updated on token use
- [ ] JSON error responses with consistent format

## Technical Notes
- Upstash Redis for rate limiting
- Token lookup by prefix + hash comparison
- Permission check middleware
- OpenAPI-compatible response format

## Design System Components
- **Code Block**: API examples in terminal style
- Green syntax highlighting for URLs
- Developer documentation styling per api-token.png

## Test Coverage

| Test Range | Description | Count |
|------------|-------------|-------|
| TC-MCP-001 to TC-MCP-005 | Authentication | 5 |
| TC-MCP-010 to TC-MCP-015 | CRUD Operations | 6 |
| TC-MCP-020 to TC-MCP-024 | Permissions | 5 |
| TC-MCP-030 to TC-MCP-032 | Rate Limiting | 3 |
| TC-MCP-040 to TC-MCP-042 | Request Validation | 3 |
| TC-MCP-050 | Error Format Consistency | 1 |

See: [Test Cases](../test-specifications/startup-hub-test-cases.md#6-mcp-api-endpoints)

## Prompt (use with feature-development)
Implement "MCP API Endpoints" for Startup Hub. Requirements:
- CRUD endpoints under `/api/mcp/projects`
- Bearer token authentication with permission checks
- Upstash rate limiting (100 req/min)
- Zod validation, consistent error format
Accept if AC met. See `design.md` for API structure and token model.
