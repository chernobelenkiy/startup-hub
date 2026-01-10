# Product Requirements Document (PRD)

## Startup Hub

> A multilingual aggregator for early-stage AI/tech startups that connects founders with team members, investors, and mentors—differentiated by MCP API integration for AI agents.

**Version:** 1.0  
**Date:** 2026-01-10  
**Status:** Planning Complete

---

## Executive Summary

Startup Hub enables founders to showcase projects at any stage (from idea to launch), find co-founders, developers, designers, and investors. Unlike Product Hunt which focuses on launched products, Startup Hub welcomes projects at the idea stage and emphasizes team-building and community. The MCP API allows AI agents to programmatically manage projects, setting it apart in the AI/tech niche.

---

## Core Documents

| Document | Description |
|----------|-------------|
| [Requirements](./requirements.md) | Goals, personas, core features, constraints, success metrics |
| [Design & Architecture](./design.md) | Tech stack, Prisma schema, API structure, security |
| [Design System](./design-system.md) | Color tokens, typography, components, accessibility |
| [Test Cases](./test-specifications/startup-hub-test-cases.md) | Comprehensive test specification (120 cases) |
| [Test Report](./test-specifications/startup-hub-report.md) | Testing strategy, risks, and recommendations |

---

## Design References

| Screen | Mockup |
|--------|--------|
| Authentication | [auth.png](../auth.png) |
| Project Details | [startup-details.png](../startup-details.png) |
| User Dashboard | [user-dasboard.png](../user-dasboard.png) |
| API Tokens | [api-token.png](../api-token.png) |

---

## Features by Phase

### Phase 1: Foundation
| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| [Authentication System](./features/auth-system.md) | High | L | Email/OAuth login, session management, protected routes |

### Phase 2: Core
| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| [Project CRUD](./features/project-crud.md) | High | XL | Create, edit, delete projects with rich forms |
| [Project Listing & Filtering](./features/project-listing.md) | High | L | Homepage grid, search, filters, pagination |

### Phase 3: Engagement
| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| [Like System](./features/like-system.md) | Medium | M | Like/unlike with optimistic updates |

### Phase 4: Integration
| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| [API Token Management](./features/api-tokens.md) | High | L | Generate, view, revoke tokens for MCP |
| [MCP API Endpoints](./features/mcp-api.md) | High | L | RESTful API for AI agents |

---

## Implementation Roadmap

```
Week 1-2: Foundation
├── Project setup (Next.js 14, Prisma, Tailwind, shadcn/ui)
├── Database schema & migrations
└── Authentication system

Week 3-4: Core
├── Project CRUD operations
├── Dashboard interface
└── Project listing & filtering

Week 5: Engagement + Integration
├── Like system
├── API token management
└── MCP API endpoints

Week 6: Polish & Deploy
├── Testing & bug fixes
├── Performance optimization
└── Production deployment
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL |
| Auth | NextAuth.js (Auth.js v5) |
| i18n | next-intl |
| Storage | Vercel Blob |
| Rate Limiting | Upstash Redis |
| Hosting | Vercel |

---

## Success Criteria

- [ ] 500 registered users in first 3 months
- [ ] 200 projects created in first 3 months
- [ ] API token adoption indicates MCP usage
- [ ] Average page load < 2 seconds
- [ ] WCAG 2.1 AA accessibility compliance

---

## Out of Scope (v2)

- Comments/discussions
- Following/subscribing
- Email/push notifications
- Full-text search (Meilisearch)
- Content translations
- Project verification badges
- Analytics dashboard

---

## Quick Links

**Start Implementation:**
1. Read [Requirements](./requirements.md) for scope
2. Reference [Design](./design.md) for architecture decisions
3. Use [Design System](./design-system.md) for UI implementation
4. Pick a feature from Phase 1 and follow its prompt

**For AI Agents:**
Each feature file contains a self-contained `## Prompt` section ready for use with development workflows.
