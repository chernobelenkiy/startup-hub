import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TokensPageClient } from "./tokens-page-client";

export async function generateMetadata() {
  const t = await getTranslations("apiTokens");
  return {
    title: t("title"),
    description: t("description"),
  };
}

/**
 * Server component for fetching user's tokens
 */
async function getTokens(userId: string) {
  // Fetch tokens for the user
  const tokens = await db.aPIToken.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
      permissions: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get revoked status for each token using raw query
  const tokenIds = tokens.map((t) => t.id);

  let revokedIds = new Set<string>();

  if (tokenIds.length > 0) {
    const revokedTokens = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM api_tokens
      WHERE id = ANY(${tokenIds}::text[])
      AND "revokedAt" IS NOT NULL
    `;
    revokedIds = new Set(revokedTokens.map((t) => t.id));
  }

  // Map tokens with status and serialize dates
  return tokens.map((token) => ({
    id: token.id,
    name: token.name,
    permissions: token.permissions,
    status: revokedIds.has(token.id) ? ("revoked" as const) : ("active" as const),
    createdAt: token.createdAt.toISOString(),
    lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
    expiresAt: token.expiresAt?.toISOString() ?? null,
  }));
}

/**
 * Count active (non-revoked) tokens for the user
 */
async function getActiveTokenCount(userId: string): Promise<number> {
  const result = await db.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM api_tokens
    WHERE "userId" = ${userId}
    AND "revokedAt" IS NULL
  `;
  return Number(result[0]?.count ?? 0);
}

export default async function TokensPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [tokens, activeCount] = await Promise.all([
    getTokens(session.user.id),
    getActiveTokenCount(session.user.id),
  ]);

  return (
    <TokensPageClient
      initialTokens={tokens}
      initialActiveCount={activeCount}
    />
  );
}
