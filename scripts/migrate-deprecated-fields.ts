/**
 * Migration Script: Deprecated Project Fields to ProjectTranslation
 *
 * This script migrates data from deprecated fields on the Project model
 * to the ProjectTranslation model.
 *
 * Deprecated fields:
 * - title, shortDescription, pitch, traction, investmentDetails, language
 *
 * Run with: npx tsx scripts/migrate-deprecated-fields.ts
 *
 * Options:
 * --dry-run: Preview changes without applying them
 * --force: Apply changes even if translations already exist
 */

import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

interface MigrationStats {
  projectsScanned: number;
  projectsWithDeprecatedData: number;
  projectsAlreadyMigrated: number;
  projectsMigrated: number;
  translationsCreated: number;
  errors: string[];
}

async function migrateDeprecatedFields(options: {
  dryRun: boolean;
  force: boolean;
}): Promise<MigrationStats> {
  const stats: MigrationStats = {
    projectsScanned: 0,
    projectsWithDeprecatedData: 0,
    projectsAlreadyMigrated: 0,
    projectsMigrated: 0,
    translationsCreated: 0,
    errors: [],
  };

  console.log("🔍 Scanning projects for deprecated field data...\n");

  // Fetch all projects with their translations
  const projects = await prisma.project.findMany({
    include: {
      translations: true,
    },
  });

  stats.projectsScanned = projects.length;

  for (const project of projects) {
    // Check if project has deprecated field data
    const hasDeprecatedData =
      project.title ||
      project.shortDescription ||
      project.pitch ||
      project.traction ||
      project.investmentDetails;

    if (!hasDeprecatedData) {
      continue;
    }

    stats.projectsWithDeprecatedData++;

    // Determine language from deprecated field
    const lang = project.language || "en";

    // Check if translation already exists for this language
    const existingTranslation = project.translations.find(
      (t) => t.language === lang
    );

    if (existingTranslation && !options.force) {
      stats.projectsAlreadyMigrated++;
      console.log(
        `⏭️  Project ${project.slug}: Translation for '${lang}' already exists, skipping`
      );
      continue;
    }

    // Build translation data from deprecated fields
    const translationData = {
      language: lang,
      title: project.title || "Untitled",
      shortDescription: project.shortDescription || "No description",
      pitch: project.pitch || "No pitch provided",
      traction: project.traction || null,
      investmentDetails: project.investmentDetails || null,
      features: null, // New field, not in deprecated schema
    };

    console.log(`\n📋 Project: ${project.slug}`);
    console.log(`   Language: ${lang}`);
    console.log(`   Title: ${translationData.title}`);
    console.log(`   Short Description: ${translationData.shortDescription.substring(0, 50)}...`);

    if (options.dryRun) {
      console.log(`   ⚠️  DRY RUN - Would create translation`);
      stats.projectsMigrated++;
      stats.translationsCreated++;
      continue;
    }

    try {
      if (existingTranslation && options.force) {
        // Update existing translation
        await prisma.projectTranslation.update({
          where: { id: existingTranslation.id },
          data: translationData,
        });
        console.log(`   ✅ Updated existing translation`);
      } else {
        // Create new translation
        await prisma.projectTranslation.create({
          data: {
            projectId: project.id,
            ...translationData,
          },
        });
        console.log(`   ✅ Created new translation`);
      }
      stats.projectsMigrated++;
      stats.translationsCreated++;
    } catch (error) {
      const errorMsg = `Error migrating project ${project.slug}: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
    }
  }

  return stats;
}

async function clearDeprecatedFields(options: { dryRun: boolean }): Promise<void> {
  console.log("\n🧹 Clearing deprecated fields from migrated projects...\n");

  // Find projects that have both deprecated data AND translations
  const projects = await prisma.project.findMany({
    where: {
      translations: {
        some: {},
      },
      OR: [
        { title: { not: null } },
        { shortDescription: { not: null } },
        { pitch: { not: null } },
        { traction: { not: null } },
        { investmentDetails: { not: null } },
      ],
    },
    include: {
      translations: true,
    },
  });

  console.log(`Found ${projects.length} projects with both deprecated data and translations`);

  for (const project of projects) {
    console.log(`\n📋 Project: ${project.slug}`);
    console.log(`   Translations: ${project.translations.map((t) => t.language).join(", ")}`);

    if (options.dryRun) {
      console.log(`   ⚠️  DRY RUN - Would clear deprecated fields`);
      continue;
    }

    await prisma.project.update({
      where: { id: project.id },
      data: {
        title: null,
        shortDescription: null,
        pitch: null,
        traction: null,
        investmentDetails: null,
        // Keep language field for backwards compat during migration
      },
    });
    console.log(`   ✅ Cleared deprecated fields`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const clearAfter = args.includes("--clear");

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Deprecated Fields Migration Script");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes will be made)" : "LIVE"}`);
  console.log(`Force: ${force ? "Yes (will update existing translations)" : "No"}`);
  console.log(`Clear after: ${clearAfter ? "Yes" : "No"}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    // Step 1: Migrate data
    const stats = await migrateDeprecatedFields({ dryRun, force });

    // Step 2: Optionally clear deprecated fields
    if (clearAfter) {
      await clearDeprecatedFields({ dryRun });
    }

    // Print summary
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  Migration Summary");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`Projects scanned:           ${stats.projectsScanned}`);
    console.log(`With deprecated data:       ${stats.projectsWithDeprecatedData}`);
    console.log(`Already migrated (skipped): ${stats.projectsAlreadyMigrated}`);
    console.log(`Migrated this run:          ${stats.projectsMigrated}`);
    console.log(`Translations created:       ${stats.translationsCreated}`);
    console.log(`Errors:                     ${stats.errors.length}`);
    console.log("═══════════════════════════════════════════════════════════\n");

    if (stats.errors.length > 0) {
      console.log("Errors encountered:");
      stats.errors.forEach((e) => console.log(`  - ${e}`));
    }

    if (dryRun) {
      console.log("ℹ️  This was a dry run. Run without --dry-run to apply changes.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
