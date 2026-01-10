# Product Requirements: Startup Hub

## Overview
Startup Hub is a multilingual aggregator for early-stage AI/tech startups that connects founders with team members, investors, and mentors—differentiated from Product Hunt by supporting projects at any stage (from idea to launch) with MCP API integration for AI agents.

## Core Goals
- Enable founders to showcase projects at any stage (idea → launched)
- Connect projects with developers, designers, investors, and mentors
- Provide AI-first automation via MCP API for agent-driven project management
- Support multilingual content (EN/RU) with automatic locale detection
- Lower the entry barrier compared to Product Hunt/BetaList

## Users/Personas
- **Founders**: Create/manage projects, seek team members, pitch to investors
- **Investors**: Discover early-stage opportunities, filter by investment needs
- **Specialists**: Find projects looking for their skills (dev, design, marketing)
- **AI Agents**: Programmatically create/update projects via MCP API

## Core Features
- **Auth System**: Email/password + OAuth (Google/LinkedIn), session management
- **Project CRUD**: Create, edit, delete projects with rich details (pitch, team, tags, investment info)
- **Project Listing**: Filterable grid view with search, status/tag/role filters, sorting
- **Like System**: Authenticated users can like projects, denormalized count display
- **API Tokens**: Generate/manage tokens for MCP authentication with permissions
- **MCP Endpoints**: RESTful API for AI agents to manage projects programmatically

## Non-Functional
- **Performance**: Initial page load < 2s, pagination for large lists
- **Security**: Secure token storage (hashed), rate limiting on API, input sanitization
- **Scalability**: Stateless architecture, database indexing on filters
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support
- **i18n**: Auto-detect locale (cookie → Accept-Language → IP → default EN)

## Constraints & Assumptions
- Tech stack: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Prisma, PostgreSQL
- Auth: NextAuth.js with email + OAuth providers
- Hosting: Vercel with Edge Middleware for locale detection
- Image storage: Vercel Blob or Cloudflare R2
- Rate limiting: Upstash for API protection

## Success Metrics
- User registration count (target: 500 users in first 3 months)
- Projects created (target: 200 projects in first 3 months)
- API token generation rate (proxy for MCP adoption)
- Like engagement rate (likes per project, active likers)

## Out of Scope (v2)
- Comments/discussions on projects
- Following/subscribing to projects
- Email/push notifications
- Full-text search with Meilisearch
- Automatic content translations
- Project verification badges
- Analytics dashboard for project views
