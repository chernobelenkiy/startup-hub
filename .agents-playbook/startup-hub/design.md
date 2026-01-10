# Technical Architecture: Startup Hub

## Overview
Server-rendered Next.js 14 application with App Router, PostgreSQL database via Prisma ORM, and a dedicated MCP API layer for AI agent integration—deployed on Vercel with Edge Middleware for locale detection.

## Tech Stack

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Frontend | Next.js (App Router) | 14.x | Server components, streaming, built-in API routes |
| Styling | Tailwind CSS + shadcn/ui | 3.x / latest | Rapid iteration, consistent design tokens |
| Database | PostgreSQL | 15+ | Full-text search, JSON support, mature ecosystem |
| ORM | Prisma | 5.x | Type-safe queries, migrations, schema-first |
| Auth | NextAuth.js | 5.x (Auth.js) | OAuth providers, session management, JWT |
| i18n | next-intl | 3.x | App Router compatible, ICU message format |
| Hosting | Vercel | - | Zero-config deploys, Edge Middleware, Blob storage |

## Architecture Patterns

- **Rendering**: Server Components by default, Client Components for interactivity (likes, filters, forms)
- **Data Access**: Prisma client in Server Components/API routes only, no direct DB access from client
- **API Structure**: 
  - `/api/auth/*` — NextAuth handlers
  - `/api/projects/*` — Web app CRUD (session auth)
  - `/api/mcp/*` — AI agent endpoints (Bearer token auth)
- **State Management**: React Server Components + URL state for filters; no client state library needed
- **File Structure**: Feature-based under `app/[locale]/` with shared `components/` and `lib/`

## Data Model (Prisma)

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  avatarUrl String?
  locale    String    @default("en")
  projects  Project[]
  likes     Like[]
  apiTokens APIToken[]
  createdAt DateTime  @default(now())
}

model Project {
  id               String   @id @default(cuid())
  slug             String   @unique
  ownerId          String
  owner            User     @relation(fields: [ownerId], references: [id])
  title            String
  shortDescription String   @db.VarChar(280)
  pitch            String   @db.VarChar(500)
  screenshotUrl    String?
  websiteUrl       String?
  status           ProjectStatus @default(IDEA)
  estimatedLaunch  DateTime?
  needsInvestment  Boolean  @default(false)
  investmentDetails String?
  teamMembers      Json     @default("[]")
  lookingFor       String[] @default([])
  tags             String[] @default([])
  likesCount       Int      @default(0)
  language         String   @default("en")
  likes            Like[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@index([status, createdAt])
  @@index([tags])
}

model Like {
  userId    String
  projectId String
  user      User    @relation(fields: [userId], references: [id])
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  
  @@id([userId, projectId])
}

model APIToken {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  tokenHash   String   @unique
  name        String
  permissions String[] @default(["read"])
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
}

enum ProjectStatus {
  IDEA
  MVP
  BETA
  LAUNCHED
  PAUSED
}
```

## Authentication & Authorization

- **Web Sessions**: NextAuth.js with JWT strategy, cookies httpOnly/secure
- **OAuth Providers**: Google, LinkedIn (configurable)
- **MCP API Auth**: Bearer tokens, hashed with bcrypt, validated per-request
- **Permissions**: Token-level permissions array (`read`, `create`, `update`, `delete`)
- **Route Protection**: Middleware checks session for `/dashboard/*`, API routes check auth internally

## Integration Points

- **Vercel Blob**: Project screenshot uploads (presigned URLs)
- **Upstash Redis**: Rate limiting for MCP API (100 req/min per token)
- **Edge Middleware**: Locale detection from cookie → Accept-Language → geo → default

## Performance

- Server Components for initial render (zero JS for static content)
- Incremental Static Regeneration for project detail pages (revalidate: 60s)
- Database indexes on `status`, `createdAt`, `tags` for filter queries
- Pagination: cursor-based for infinite scroll, limit 20 per page
- Image optimization via `next/image` with Vercel CDN

## Security

- CSRF protection via NextAuth (SameSite cookies)
- API tokens hashed with bcrypt (12 rounds), never stored plain
- Input sanitization with Zod schemas on all endpoints
- Rate limiting: 100 req/min for MCP API, 1000 req/min for web API
- Content Security Policy headers via `next.config.js`
