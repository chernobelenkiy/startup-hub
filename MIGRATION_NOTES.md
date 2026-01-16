# Database Migration Required

## Features Field Addition

A database migration is required to add the `features` field to the `project_translations` table.

### Schema Changes
- Added `features` column to `project_translations` table (nullable TEXT field)
- Character limit: 10,000 characters (enforced at application level)

### Migration SQL
```sql
-- Add features column to project_translations table
ALTER TABLE "project_translations" ADD COLUMN "features" TEXT;
```

### To Run Migration
```bash
npx prisma migrate dev --name add_features_field
```

Or in production:
```bash
npx prisma migrate deploy
```

### Changes Made
1. Updated Prisma schema (`prisma/schema.prisma`)
2. Updated validation schemas (`lib/validations/project.ts`)
3. Updated project form component (`components/project/project-form.tsx`)
4. Updated MCP tools:
   - `server/mcp-tools/get-project.ts`
   - `server/mcp-tools/create-project.ts`
   - `server/mcp-tools/update-project.ts`

### Dependencies
- Added `dotenv` as dev dependency for Prisma config support
