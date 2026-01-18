import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("[db] DATABASE_URL is not defined");
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

function getDb(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();

  // Cache client in development to prevent connection exhaustion during hot reload
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

/**
 * Lazy-initialized Prisma client using a Proxy.
 * This defers connection until actual database access, allowing errors
 * to be caught in route handlers rather than at module load time.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getDb();
    const value = client[prop as keyof PrismaClient];
    // Bind methods to preserve `this` context
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export type { PrismaClient };

// Re-export types for convenience
export type {
  User,
  Account,
  Session,
  Project,
  ProjectTranslation,
  Like,
  APIToken,
} from "@/lib/generated/prisma/client";

export { ProjectStatus } from "@/lib/generated/prisma/client";
