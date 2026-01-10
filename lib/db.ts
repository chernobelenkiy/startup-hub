import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;

  // Create Prisma adapter for Neon serverless
  const adapter = new PrismaNeon({ connectionString });

  // Create Prisma client with adapter
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export type { PrismaClient };

// Re-export types for convenience
export type {
  User,
  Account,
  Session,
  Project,
  Like,
  APIToken,
} from "@/lib/generated/prisma/client";

export { ProjectStatus } from "@/lib/generated/prisma/client";
