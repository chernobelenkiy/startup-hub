import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockUserWithFullProfile,
  createMockProjectWithTranslations,
} from "../utils/helpers";

/**
 * Integration Tests for MCP Author Data
 *
 * Test Cases Covered:
 * - TC-MCP-001: get_project returns author social links
 * - TC-MCP-002: get_project returns author profile info
 */

// Mock modules before imports
vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
  },
}));

// Import after mocks are set up
import { getProjectHandler } from "@/server/mcp-tools/get-project";
import { db } from "@/lib/db";

const mockDb = vi.mocked(db);

describe("MCP Author Data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get_project handler", () => {
    // TC-MCP-001: get_project returns author social links
    it("returns project with author social links", async () => {
      const authorWithProfile = createMockUserWithFullProfile({
        id: "author-id",
        name: "Project Author",
      });

      const projectWithAuthor = {
        ...createMockProjectWithTranslations(["en"], {
          id: "project-1",
          slug: "test-project",
          title: "Test Project",
        }),
        owner: {
          id: authorWithProfile.id,
          name: authorWithProfile.name,
          image: authorWithProfile.avatarUrl,
          bio: authorWithProfile.bio,
          title: authorWithProfile.title,
          company: authorWithProfile.company,
          socialLinks: authorWithProfile.socialLinks,
          openToContact: authorWithProfile.openToContact,
        },
      };

      mockDb.project.findFirst.mockResolvedValue(projectWithAuthor as never);

      const result = await getProjectHandler({ slug: "test-project" }, null);

      expect(result.success).toBe(true);
      expect(result.data?.project).toBeDefined();
      expect(result.data?.project.owner).toBeDefined();
      expect(result.data?.project.owner.socialLinks).toEqual(authorWithProfile.socialLinks);
      expect(result.data?.project.owner.socialLinks?.linkedin).toBe("https://linkedin.com/in/testuser");
      expect(result.data?.project.owner.socialLinks?.github).toBe("https://github.com/testuser");
    });

    // TC-MCP-002: get_project returns author profile info
    it("returns project with full author profile info", async () => {
      const authorWithProfile = createMockUserWithFullProfile({
        id: "author-id",
        name: "Jane Doe",
        bio: "Building the future of tech",
        title: "Founder & CEO",
        company: "TechCo",
      });

      const projectWithAuthor = {
        ...createMockProjectWithTranslations(["en"], {
          id: "project-1",
          slug: "test-project",
        }),
        owner: {
          id: authorWithProfile.id,
          name: authorWithProfile.name,
          image: authorWithProfile.avatarUrl,
          bio: authorWithProfile.bio,
          title: authorWithProfile.title,
          company: authorWithProfile.company,
          socialLinks: authorWithProfile.socialLinks,
          openToContact: authorWithProfile.openToContact,
        },
      };

      mockDb.project.findFirst.mockResolvedValue(projectWithAuthor as never);

      const result = await getProjectHandler({ slug: "test-project" }, null);

      expect(result.success).toBe(true);
      expect(result.data?.project.owner).toBeDefined();
      expect(result.data?.project.owner.bio).toBe("Building the future of tech");
      expect(result.data?.project.owner.title).toBe("Founder & CEO");
      expect(result.data?.project.owner.company).toBe("TechCo");
      expect(result.data?.project.owner.openToContact).toBe(true);
    });

    it("returns project with minimal author info when profile is empty", async () => {
      const authorWithMinimalProfile = {
        id: "author-id",
        name: "Basic User",
        image: null,
        bio: null,
        title: null,
        company: null,
        socialLinks: null,
        openToContact: false,
      };

      const projectWithAuthor = {
        ...createMockProjectWithTranslations(["en"], {
          id: "project-1",
          slug: "test-project",
        }),
        owner: authorWithMinimalProfile,
      };

      mockDb.project.findFirst.mockResolvedValue(projectWithAuthor as never);

      const result = await getProjectHandler({ slug: "test-project" }, null);

      expect(result.success).toBe(true);
      expect(result.data?.project.owner).toBeDefined();
      expect(result.data?.project.owner.name).toBe("Basic User");
      expect(result.data?.project.owner.bio).toBeNull();
      expect(result.data?.project.owner.socialLinks).toBeNull();
    });

    it("returns error when project not found", async () => {
      mockDb.project.findFirst.mockResolvedValue(null);

      const result = await getProjectHandler({ slug: "non-existent" }, null);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Project not found");
    });
  });
});
