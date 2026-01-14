import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Filter option with count of matching projects
 */
interface FilterOption {
  value: string;
  count: number;
}

/**
 * Response type for the filters endpoint
 */
interface FiltersResponse {
  tags: FilterOption[];
  roles: FilterOption[];
  statuses: FilterOption[];
}

/**
 * GET /api/filters
 * Returns aggregated filter options from real database data
 * - Tags: Top 20 most popular tags across all projects
 * - Roles: All unique roles that projects are looking for
 * - Statuses: All statuses with their project counts
 *
 * All values are returned in English (no i18n for search filters)
 */
export async function GET() {
  try {
    // Fetch all data in parallel for better performance
    const [tagsResult, rolesResult, statusesResult] = await Promise.all([
      // Get top 20 most popular tags
      db.$queryRaw<{ tag: string; count: bigint }[]>`
        SELECT UNNEST(tags) as tag, COUNT(*) as count
        FROM "projects"
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 20
      `,

      // Get all roles that projects are looking for
      db.$queryRaw<{ role: string; count: bigint }[]>`
        SELECT UNNEST("lookingFor") as role, COUNT(*) as count
        FROM "projects"
        GROUP BY role
        ORDER BY count DESC
      `,

      // Get status counts
      db.project.groupBy({
        by: ["status"],
        _count: { status: true },
        orderBy: { _count: { status: "desc" } },
      }),
    ]);

    // Transform tags result (bigint to number)
    const tags: FilterOption[] = tagsResult.map((row) => ({
      value: row.tag,
      count: Number(row.count),
    }));

    // Transform roles result (bigint to number)
    const roles: FilterOption[] = rolesResult.map((row) => ({
      value: row.role,
      count: Number(row.count),
    }));

    // Transform statuses result
    const statuses: FilterOption[] = statusesResult.map((row) => ({
      value: row.status,
      count: row._count.status,
    }));

    const response: FiltersResponse = {
      tags,
      roles,
      statuses,
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 1 minute on CDN, stale-while-revalidate for 5 minutes
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}
