-- Migration: Remove Deprecated Fields from Project Table
-- =======================================================
--
-- This migration removes deprecated fields that have been migrated
-- to the ProjectTranslation table.
--
-- IMPORTANT: Run the data migration script BEFORE applying this migration:
--   npx tsx scripts/migrate-deprecated-fields.ts
--
-- Then verify all data is migrated:
--   npx tsx scripts/migrate-deprecated-fields.ts --dry-run
--
-- Fields being removed:
--   - title (moved to project_translations.title)
--   - short_description (moved to project_translations.short_description)
--   - pitch (moved to project_translations.pitch)
--   - traction (moved to project_translations.traction)
--   - investment_details (moved to project_translations.investment_details)
--   - language (no longer needed, translations have their own language field)
--
-- Also removes the language index as it's no longer needed.

-- Step 1: Verify no projects have deprecated data without translations
-- This query should return 0 rows. If it doesn't, run the migration script first.
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM projects p
  WHERE (
    p.title IS NOT NULL
    OR p.short_description IS NOT NULL
    OR p.pitch IS NOT NULL
    OR p.traction IS NOT NULL
    OR p.investment_details IS NOT NULL
  )
  AND NOT EXISTS (
    SELECT 1 FROM project_translations pt WHERE pt.project_id = p.id
  );

  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Found % projects with deprecated data but no translations. Run the migration script first.', orphan_count;
  END IF;
END $$;

-- Step 2: Drop the language index
DROP INDEX IF EXISTS "projects_language_idx";

-- Step 3: Remove deprecated columns
ALTER TABLE "projects"
  DROP COLUMN IF EXISTS "title",
  DROP COLUMN IF EXISTS "short_description",
  DROP COLUMN IF EXISTS "pitch",
  DROP COLUMN IF EXISTS "traction",
  DROP COLUMN IF EXISTS "investment_details",
  DROP COLUMN IF EXISTS "language";

-- Step 4: Add comment for documentation
COMMENT ON TABLE "projects" IS 'Core project data. Translatable content is in project_translations table.';
