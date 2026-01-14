/**
 * Migration script to copy existing project data to Russian translations
 *
 * Run with: npx tsx scripts/migrate-translations.ts
 */

import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting translation migration...");

  // Get all projects that don't have translations yet
  const projects = await prisma.project.findMany({
    include: {
      translations: true,
    },
  });

  console.log(`Found ${projects.length} projects to migrate`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const project of projects) {
    // Check if project already has a translation for its language
    const existingTranslation = project.translations.find(
      (t) => t.language === project.language
    );

    if (existingTranslation) {
      console.log(`Skipping project ${project.slug} - already has ${project.language} translation`);
      skippedCount++;
      continue;
    }

    // Skip if no translatable content exists
    if (!project.title || !project.shortDescription || !project.pitch) {
      console.log(`Skipping project ${project.slug} - missing required fields`);
      skippedCount++;
      continue;
    }

    // Create translation from existing data
    // Default to Russian ("ru") as specified in the plan
    const language = project.language === "en" || project.language === "ru"
      ? project.language
      : "ru";

    await prisma.projectTranslation.create({
      data: {
        projectId: project.id,
        language,
        title: project.title,
        shortDescription: project.shortDescription,
        pitch: project.pitch,
        traction: project.traction,
        investmentDetails: project.investmentDetails,
      },
    });

    console.log(`Migrated project ${project.slug} to ${language} translation`);
    migratedCount++;
  }

  console.log("\nMigration complete!");
  console.log(`- Migrated: ${migratedCount}`);
  console.log(`- Skipped: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
