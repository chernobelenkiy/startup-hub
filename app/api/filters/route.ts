import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { FilterOption, FiltersResponse } from "@/lib/types/filters";

const EMPTY_RESPONSE: FiltersResponse = {
  tags: [],
  roles: [],
  statuses: [],
};

/**
 * GET /api/filters
 * Returns aggregated filter options from real database data.
 * - Tags: Top 20 most popular tags across all projects
 * - Roles: All unique roles that projects are looking for
 * - Statuses: All statuses with their project counts
 *
 * All values are returned in English (no i18n for search filters).
 * Returns empty arrays on error to ensure graceful degradation.
 */
export async function GET() {
  try {
    const [tagsResult, rolesResult, statusesResult] = await Promise.all([
      db.$queryRaw<{ tag: string; count: bigint }[]>`
        SELECT UNNEST(tags) as tag, COUNT(*) as count
        FROM "projects"
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 20
      `,
      db.$queryRaw<{ role: string; count: bigint }[]>`
        SELECT UNNEST("lookingFor") as role, COUNT(*) as count
        FROM "projects"
        GROUP BY role
        ORDER BY count DESC
      `,
      db.project.groupBy({
        by: ["status"],
        _count: { status: true },
        orderBy: { _count: { status: "desc" } },
      }),
    ]);

    const tags: FilterOption[] = tagsResult.map((row) => ({
      value: row.tag,
      count: Number(row.count),
    }));

    const roles: FilterOption[] = rolesResult.map((row) => ({
      value: row.role,
      count: Number(row.count),
    }));

    const statuses: FilterOption[] = statusesResult.map((row) => ({
      value: row.status,
      count: row._count.status,
    }));

    return NextResponse.json(
      { tags, roles, statuses },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[api/filters] Error fetching filter options:", error);
    return NextResponse.json(EMPTY_RESPONSE);
  }
}
