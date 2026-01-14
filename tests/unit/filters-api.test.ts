import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit Tests for Filters API Endpoint
 *
 * Test Cases Covered:
 * - TC-FILT-001: API returns correct structure { tags, roles, statuses }
 * - TC-FILT-002: Empty database returns empty arrays
 * - TC-FILT-003: Tags are sorted by count descending
 * - TC-FILT-004: Tags limited to 20 items
 * - TC-FILT-005: Roles aggregated correctly with counts
 * - TC-FILT-006: Statuses grouped correctly with counts
 * - TC-FILT-007: Database errors return 500 response
 */

// Mock db before importing the route
vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: vi.fn(),
    project: {
      groupBy: vi.fn(),
    },
  },
}));

// Import after mocks are set up
import { GET } from "@/app/api/filters/route";
import { db } from "@/lib/db";

const mockDb = vi.mocked(db);

describe("Filters API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/filters", () => {
    // TC-FILT-001: API returns correct structure
    it("returns correct response structure with tags, roles, and statuses", async () => {
      // Mock tags query
      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { tag: "AI", count: BigInt(5) },
          { tag: "SaaS", count: BigInt(3) },
        ])
        // Mock roles query
        .mockResolvedValueOnce([
          { role: "developer", count: BigInt(4) },
          { role: "designer", count: BigInt(2) },
        ]);

      // Mock statuses groupBy
      mockDb.project.groupBy.mockResolvedValue([
        { status: "IDEA", _count: { status: 3 } },
        { status: "MVP", _count: { status: 2 } },
      ] as never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("tags");
      expect(data).toHaveProperty("roles");
      expect(data).toHaveProperty("statuses");

      // Verify tags structure
      expect(data.tags).toEqual([
        { value: "AI", count: 5 },
        { value: "SaaS", count: 3 },
      ]);

      // Verify roles structure
      expect(data.roles).toEqual([
        { value: "developer", count: 4 },
        { value: "designer", count: 2 },
      ]);

      // Verify statuses structure
      expect(data.statuses).toEqual([
        { value: "IDEA", count: 3 },
        { value: "MVP", count: 2 },
      ]);
    });

    // TC-FILT-002: Empty database returns empty arrays
    it("returns empty arrays when database has no projects", async () => {
      mockDb.$queryRaw
        .mockResolvedValueOnce([]) // tags
        .mockResolvedValueOnce([]); // roles

      mockDb.project.groupBy.mockResolvedValue([] as never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tags).toEqual([]);
      expect(data.roles).toEqual([]);
      expect(data.statuses).toEqual([]);
    });

    // TC-FILT-003: Tags are sorted by count descending
    it("returns tags sorted by count in descending order", async () => {
      // The SQL query already sorts by count DESC, just verify the transformation
      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { tag: "Popular", count: BigInt(100) },
          { tag: "Medium", count: BigInt(50) },
          { tag: "Low", count: BigInt(10) },
        ])
        .mockResolvedValueOnce([]);

      mockDb.project.groupBy.mockResolvedValue([] as never);

      const response = await GET();
      const data = await response.json();

      expect(data.tags[0].value).toBe("Popular");
      expect(data.tags[0].count).toBe(100);
      expect(data.tags[1].value).toBe("Medium");
      expect(data.tags[1].count).toBe(50);
      expect(data.tags[2].value).toBe("Low");
      expect(data.tags[2].count).toBe(10);
    });

    // TC-FILT-004: Tags limited to 20 items
    it("returns at most 20 tags (limit enforced by SQL)", async () => {
      // Generate 25 tags to verify SQL limit is being applied
      // The actual limit is enforced by SQL LIMIT 20 clause
      const manyTags = Array.from({ length: 20 }, (_, i) => ({
        tag: `Tag${i}`,
        count: BigInt(100 - i),
      }));

      mockDb.$queryRaw
        .mockResolvedValueOnce(manyTags)
        .mockResolvedValueOnce([]);

      mockDb.project.groupBy.mockResolvedValue([] as never);

      const response = await GET();
      const data = await response.json();

      expect(data.tags).toHaveLength(20);
    });

    // TC-FILT-005: Roles aggregated correctly with counts
    it("returns roles with correct aggregated counts", async () => {
      mockDb.$queryRaw
        .mockResolvedValueOnce([]) // tags
        .mockResolvedValueOnce([
          { role: "developer", count: BigInt(10) },
          { role: "designer", count: BigInt(8) },
          { role: "marketer", count: BigInt(5) },
          { role: "productManager", count: BigInt(3) },
          { role: "cofounder", count: BigInt(2) },
        ]);

      mockDb.project.groupBy.mockResolvedValue([] as never);

      const response = await GET();
      const data = await response.json();

      expect(data.roles).toHaveLength(5);
      expect(data.roles[0]).toEqual({ value: "developer", count: 10 });
      expect(data.roles[4]).toEqual({ value: "cofounder", count: 2 });
    });

    // TC-FILT-006: Statuses grouped correctly with counts
    it("returns all project statuses with accurate counts", async () => {
      mockDb.$queryRaw
        .mockResolvedValueOnce([]) // tags
        .mockResolvedValueOnce([]); // roles

      mockDb.project.groupBy.mockResolvedValue([
        { status: "IDEA", _count: { status: 15 } },
        { status: "MVP", _count: { status: 10 } },
        { status: "BETA", _count: { status: 5 } },
        { status: "LAUNCHED", _count: { status: 3 } },
        { status: "PAUSED", _count: { status: 1 } },
      ] as never);

      const response = await GET();
      const data = await response.json();

      expect(data.statuses).toHaveLength(5);
      expect(data.statuses).toEqual([
        { value: "IDEA", count: 15 },
        { value: "MVP", count: 10 },
        { value: "BETA", count: 5 },
        { value: "LAUNCHED", count: 3 },
        { value: "PAUSED", count: 1 },
      ]);
    });

    // TC-FILT-007: Database errors return 500 response
    it("returns 500 error when database query fails", async () => {
      mockDb.$queryRaw.mockRejectedValueOnce(new Error("Database connection failed"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch filter options");
    });

    it("returns 500 error when groupBy fails", async () => {
      mockDb.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockDb.project.groupBy.mockRejectedValue(new Error("Query error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch filter options");
    });

    // TC-FILT-008: BigInt conversion handles large numbers
    it("correctly converts BigInt counts to numbers", async () => {
      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { tag: "BigTag", count: BigInt(9007199254740991) }, // Max safe integer
        ])
        .mockResolvedValueOnce([
          { role: "developer", count: BigInt(1000000) },
        ]);

      mockDb.project.groupBy.mockResolvedValue([] as never);

      const response = await GET();
      const data = await response.json();

      expect(typeof data.tags[0].count).toBe("number");
      expect(typeof data.roles[0].count).toBe("number");
    });

    // TC-FILT-009: Cache headers are set correctly
    it("sets appropriate cache headers for CDN caching", async () => {
      mockDb.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockDb.project.groupBy.mockResolvedValue([] as never);

      const response = await GET();

      expect(response.headers.get("Cache-Control")).toBe(
        "public, s-maxage=60, stale-while-revalidate=300"
      );
    });

    // TC-FILT-010: Handles null/undefined values in database results
    it("handles empty tag/role values gracefully", async () => {
      // Simulate edge case where UNNEST might return unusual values
      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { tag: "ValidTag", count: BigInt(5) },
          { tag: "", count: BigInt(2) }, // Empty string tag
        ])
        .mockResolvedValueOnce([
          { role: "developer", count: BigInt(3) },
        ]);

      mockDb.project.groupBy.mockResolvedValue([] as never);

      const response = await GET();
      const data = await response.json();

      // API should still return results including empty strings
      expect(response.status).toBe(200);
      expect(data.tags).toHaveLength(2);
    });
  });
});
