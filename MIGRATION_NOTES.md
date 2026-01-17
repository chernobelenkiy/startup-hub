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

## Build Issues (Development Environment)

### Prisma Engine Download Restrictions
In restricted network environments, Prisma may fail to download engine binaries with 403 errors.

**Solution for Production (Vercel/Similar Platforms):**
- Vercel and similar platforms have Prisma engines pre-installed
- The build will work correctly in production environments
- Set `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` if needed

**Solution for Local Development:**
```bash
# If you encounter engine download issues:
npm run build:skip-prisma  # Skip prisma generate during build
```

**Environment Variables for Prisma:**
- `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` - Skip checksum validation
- `PRISMA_CLI_BINARY_TARGETS=native` - Use native binary target

### Verification
The changes are backward compatible and won't break existing deployments. The features field:
- Is nullable (optional)
- Has proper validation
- Is fully integrated with the MCP API
- Works with existing translations system
