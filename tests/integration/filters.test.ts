import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockProject,
  createMockProjectWithTranslations,
} from "../utils/helpers";

/**
 * Integration Tests for Filters API
 *
 * Test Cases Covered:
 * - TC-FILT-INT-001: Full flow - create projects with tags/roles → call filters API → verify data
 * - TC-FILT-INT-002: Filter counts match actual project counts
 * - TC-FILT-INT-003: Multiple projects with same tags aggregate correctly
 * - TC-FILT-INT-004: Projects with multiple tags count towards each tag
 * - TC-FILT-INT-005: Projects with multiple roles count towards each role
 */

// Mock db with more detailed mocks for integration testing
const mockProjects: ReturnType<typeof createMockProject>[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: vi.fn(),
    project: {
      findMany: vi.fn(() => mockProjects),
      create: vi.fn((args: { data: Partial<ReturnType<typeof createMockProject>> }) => {
        const project = createMockProject(args.data);
        mockProjects.push(project);
        return project;
      }),
      groupBy: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/filters/route";
import { db } from "@/lib/db";

const mockDb = vi.mocked(db);

describe("Filters API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjects.length = 0; // Clear mock projects
  });

  describe("Full Flow Integration", () => {
    // TC-FILT-INT-001: Full flow test
    it("returns tags and roles from created projects", async () => {
      // Simulate created projects with tags and roles
      const projectsData = [
        { tags: ["AI", "SaaS"], lookingFor: ["developer", "designer"] },
        { tags: ["AI", "B2B"], lookingFor: ["developer", "marketer"] },
        { tags: ["Fintech"], lookingFor: ["designer"] },
      ];

      // Calculate expected aggregations
      const tagCounts = new Map<string, number>();
      const roleCounts = new Map<string, number>();

      projectsData.forEach((p) => {
        p.tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
        p.lookingFor.forEach((role) => {
          roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
        });
      });

      // Mock the $queryRaw calls based on the created data
      mockDb.$queryRaw
        .mockResolvedValueOnce(
          Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count: BigInt(count) }))
            .sort((a, b) => Number(b.count) - Number(a.count))
        )
        .mockResolvedValueOnce(
          Array.from(roleCounts.entries())
            .map(([role, count]) => ({ role, count: BigInt(count) }))
            .sort((a, b) => Number(b.count) - Number(a.count))
        );

      mockDb.project.groupBy.mockResolvedValue([
        { status: "IDEA", _count: { status: 3 } },
      ] as never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify tags
      expect(data.tags).toContainEqual({ value: "AI", count: 2 });
      expect(data.tags).toContainEqual({ value: "SaaS", count: 1 });
      expect(data.tags).toContainEqual({ value: "B2B", count: 1 });
      expect(data.tags).toContainEqual({ value: "Fintech", count: 1 });

      // Verify roles
      expect(data.roles).toContainEqual({ value: "developer", count: 2 });
      expect(data.roles).toContainEqual({ value: "designer", count: 2 });
      expect(data.roles).toContainEqual({ value: "marketer", count: 1 });
    });

    // TC-FILT-INT-002: Filter counts match actual project counts
    it("filter counts accurately reflect number of projects with that tag/role", async () => {
      // Create specific scenario: 5 projects with "AI" tag, 3 with "SaaS"
      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { tag: "AI", count: BigInt(5) },
          { tag: "SaaS", count: BigInt(3) },
        ])
        .mockResolvedValueOnce([
          { role: "developer", count: BigInt(4) },
        ]);

      mockDb.project.groupBy.mockResolvedValue([
        { status: "IDEA", _count: { status: 5 } },
        { status: "MVP", _count: { status: 3 } },
      ] as never);

      const response = await GET();
      const data = await response.json();

      // AI tag should show 5 projects
      const aiTag = data.tags.find((t: { value: string }) => t.value === "AI");
      expect(aiTag.count).toBe(5);

      // SaaS tag should show 3 projects
      const saasTag = data.tags.find((t: { value: string }) => t.value === "SaaS");
      expect(saasTag.count).toBe(3);

      // Developer role should show 4 projects
      const devRole = data.roles.find((r: { value: string }) => r.value === "developer");
      expect(devRole.count).toBe(4);

      // Status counts should match
      expect(data.statuses).toContainEqual({ value: "IDEA", count: 5 });
      expect(data.statuses).toContainEqual({ value: "MVP", count: 3 });
    });

    // TC-FILT-INT-003: Multiple projects with same tags aggregate correctly
    it("correctly aggregates multiple projects sharing the same tag", async () => {
      // Scenario: 10 projects all tagged with "AI"
      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { tag: "AI", count: BigInt(10) },
        ])
        .mockResolvedValueOnce([]);

      mockDb.project.groupBy.mockResolvedValue([] as never);

      const response = await GET();
      const data = await response.json();

      expect(data.tags).toHaveLength(1);
      expect(data.tags[0]).toEqual({ value: "AI", count: 10 });
    });

    // TC-FILT-INT-004: Projects with multiple tags count towards each tag
    it("counts project towards each tag it has", async () => {
      // If a project has ["AI", "SaaS", "B2B"], it should count towards all three
      // Simulate this with the aggregated results
      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { tag: "AI", count: BigInt(3) },     // 3 projects have AI
          { tag: "SaaS", count: BigInt(3) },   // same 3 projects have SaaS
          { tag: "B2B", count: BigInt(3) },    // same 3 projects have B2B
        ])
        .mockResolvedValueOnce([]);

      mockDb.project.groupBy.mockResolvedValue([
        { status: "IDEA", _count: { status: 3 } },
      ] as never);

      const response = await GET();
      const data = await response.json();

      // All three tags should have count of 3
      expect(data.tags).toContainEqual({ value: "AI", count: 3 });
      expect(data.tags).toContainEqual({ value: "SaaS", count: 3 });
      expect(data.tags).toContainEqual({ value: "B2B", count: 3 });
    });

    // TC-FILT-INT-005: Projects with multiple roles count towards each role
    it("counts project towards each role it is looking for", async () => {
      // Project looking for ["developer", "designer", "marketer"] counts to all
      mockDb.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { role: "developer", count: BigInt(5) },
          { role: "designer", count: BigInt(5) },
          { role: "marketer", count: BigInt(5) },
        ]);

      mockDb.project.groupBy.mockResolvedValue([] as never);

      const response = await GET();
      const data = await response.json();

      expect(data.roles).toContainEqual({ value: "developer", count: 5 });
      expect(data.roles).toContainEqual({ value: "designer", count: 5 });
      expect(data.roles).toContainEqual({ value: "marketer", count: 5 });
    });

    // TC-FILT-INT-006: Mixed scenario with various projects
    it("handles complex scenario with mixed tags, roles, and statuses", async () => {
      // Complex scenario:
      // - 2 IDEA projects: both have "AI", one has "SaaS"
      // - 3 MVP projects: all have "B2B", 2 have "Fintech"
      // - 1 LAUNCHED project: has "AI" and "B2B"

      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { tag: "AI", count: BigInt(3) },      // 2 IDEA + 1 LAUNCHED
          { tag: "B2B", count: BigInt(4) },     // 3 MVP + 1 LAUNCHED
          { tag: "Fintech", count: BigInt(2) }, // 2 MVP
          { tag: "SaaS", count: BigInt(1) },    // 1 IDEA
        ])
        .mockResolvedValueOnce([
          { role: "developer", count: BigInt(4) },
          { role: "designer", count: BigInt(2) },
          { role: "investor", count: BigInt(1) },
        ]);

      mockDb.project.groupBy.mockResolvedValue([
        { status: "MVP", _count: { status: 3 } },
        { status: "IDEA", _count: { status: 2 } },
        { status: "LAUNCHED", _count: { status: 1 } },
      ] as never);

      const response = await GET();
      const data = await response.json();

      // Verify response structure
      expect(response.status).toBe(200);
      expect(data.tags.length).toBeGreaterThan(0);
      expect(data.roles.length).toBeGreaterThan(0);
      expect(data.statuses.length).toBeGreaterThan(0);

      // Verify specific counts
      expect(data.tags.find((t: { value: string }) => t.value === "AI").count).toBe(3);
      expect(data.tags.find((t: { value: string }) => t.value === "B2B").count).toBe(4);

      // Verify total status count equals 6 projects
      const totalStatusCount = data.statuses.reduce(
        (sum: number, s: { count: number }) => sum + s.count,
        0
      );
      expect(totalStatusCount).toBe(6);
    });

    // TC-FILT-INT-007: Empty projects (no tags/roles) don't break aggregation
    it("handles projects without tags or roles gracefully", async () => {
      // Some projects have no tags, some have no lookingFor
      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { tag: "AI", count: BigInt(1) }, // Only 1 project has a tag
        ])
        .mockResolvedValueOnce([]); // No projects looking for anyone

      mockDb.project.groupBy.mockResolvedValue([
        { status: "IDEA", _count: { status: 5 } }, // 5 total projects
      ] as never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tags).toHaveLength(1);
      expect(data.roles).toHaveLength(0);
      expect(data.statuses[0].count).toBe(5);
    });

    // TC-FILT-INT-008: Verify ordering is maintained
    it("maintains descending count order for tags and roles", async () => {
      mockDb.$queryRaw
        .mockResolvedValueOnce([
          { tag: "Most", count: BigInt(100) },
          { tag: "Medium", count: BigInt(50) },
          { tag: "Least", count: BigInt(10) },
        ])
        .mockResolvedValueOnce([
          { role: "developer", count: BigInt(20) },
          { role: "designer", count: BigInt(10) },
          { role: "marketer", count: BigInt(5) },
        ]);

      mockDb.project.groupBy.mockResolvedValue([
        { status: "IDEA", _count: { status: 50 } },
        { status: "MVP", _count: { status: 30 } },
        { status: "LAUNCHED", _count: { status: 20 } },
      ] as never);

      const response = await GET();
      const data = await response.json();

      // Tags should be in descending order
      expect(data.tags[0].count).toBeGreaterThanOrEqual(data.tags[1].count);
      expect(data.tags[1].count).toBeGreaterThanOrEqual(data.tags[2].count);

      // Roles should be in descending order
      expect(data.roles[0].count).toBeGreaterThanOrEqual(data.roles[1].count);
      expect(data.roles[1].count).toBeGreaterThanOrEqual(data.roles[2].count);

      // Statuses should be in descending order
      expect(data.statuses[0].count).toBeGreaterThanOrEqual(data.statuses[1].count);
      expect(data.statuses[1].count).toBeGreaterThanOrEqual(data.statuses[2].count);
    });
  });
});
