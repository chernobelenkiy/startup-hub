import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockRequest,
  createMockSession,
  createMockUser,
  createMockProject,
} from "../utils/helpers";

/**
 * Integration Tests for Comments API Routes
 *
 * Test Cases Covered:
 * - TC-COMMENT-001: Create comment on project
 * - TC-COMMENT-002: Create nested reply
 * - TC-COMMENT-003: Edit own comment (shows edited indicator)
 * - TC-COMMENT-004: Delete own comment
 * - TC-COMMENT-005: Like/unlike comment
 * - TC-COMMENT-006: Cannot edit/delete others' comments
 * - TC-COMMENT-007: List comments with nested structure
 */

// Mock session
const mockSession = createMockSession();

// Mock modules before imports
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    commentLike: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn({
      comment: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      commentLike: {
        create: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    })),
  },
}));

// Import after mocks are set up
import { GET, POST } from "@/app/api/projects/[id]/comments/route";
import { PUT, DELETE } from "@/app/api/comments/[id]/route";
import { POST as LIKE_COMMENT } from "@/app/api/comments/[id]/like/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const mockDb = vi.mocked(db);
const mockAuth = vi.mocked(auth);

// Helper to create mock comment
function createMockComment(overrides?: Partial<{
  id: string;
  content: string;
  projectId: string;
  authorId: string;
  parentId: string | null;
  likesCount: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string; avatarUrl: string | null };
  replies: unknown[];
  _count?: { likes: number };
  likes?: unknown[];
}>) {
  const authorId = overrides?.authorId ?? mockSession.user.id;
  return {
    id: "comment-1",
    content: "This is a great project!",
    projectId: "project-1",
    authorId,
    parentId: null,
    likesCount: 0,
    isEdited: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: overrides?.author ?? {
      id: authorId,
      name: mockSession.user.name || "Test User",
      avatarUrl: null,
    },
    replies: [],
    _count: { likes: overrides?.likesCount ?? 0 },
    likes: overrides?.likes ?? [],
    ...overrides,
  };
}

describe("Comments API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe("GET /api/projects/[id]/comments", () => {
    // TC-COMMENT-007: List comments with nested structure
    it("returns comments with nested replies structure", async () => {
      const project = createMockProject({ id: "project-1" });
      const parentComment = createMockComment({ id: "comment-1", projectId: "project-1" });
      const replyComment = createMockComment({
        id: "comment-2",
        content: "I agree!",
        parentId: "comment-1",
        projectId: "project-1",
        authorId: "other-user",
        author: { id: "other-user", name: "Other User", avatarUrl: null },
      });

      // Mock project exists
      mockDb.project.findUnique.mockResolvedValue({ id: project.id } as never);

      // Return flat list - API builds the tree
      mockDb.comment.findMany.mockResolvedValue([parentComment, replyComment] as never);

      const request = createMockRequest("GET");
      const response = await GET(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments).toHaveLength(1);
      expect(data.comments[0].replies).toHaveLength(1);
      expect(data.comments[0].replies[0].content).toBe("I agree!");
    });

    it("returns empty array when project has no comments", async () => {
      const project = createMockProject({ id: "project-1" });
      mockDb.project.findUnique.mockResolvedValue({ id: project.id } as never);
      mockDb.comment.findMany.mockResolvedValue([]);

      const request = createMockRequest("GET");
      const response = await GET(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments).toHaveLength(0);
    });

    it("includes like status for authenticated user", async () => {
      const project = createMockProject({ id: "project-1" });
      mockDb.project.findUnique.mockResolvedValue({ id: project.id } as never);
      
      // The API transforms likes array into isLiked boolean
      const commentWithLikes = {
        ...createMockComment({ projectId: "project-1" }),
        likes: [{ id: "like-1" }], // User has liked this comment
      };

      mockDb.comment.findMany.mockResolvedValue([commentWithLikes] as never);

      const request = createMockRequest("GET");
      const response = await GET(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments[0].isLiked).toBe(true);
    });
  });

  describe("POST /api/projects/[id]/comments", () => {
    // TC-COMMENT-001: Create comment on project
    it("creates a new comment on a project", async () => {
      const project = createMockProject();
      mockDb.project.findUnique.mockResolvedValue(project as never);

      const newComment = createMockComment({
        content: "Awesome project idea!",
      });
      mockDb.comment.create.mockResolvedValue(newComment as never);

      const request = createMockRequest("POST", {
        content: "Awesome project idea!",
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.comment).toBeDefined();
      expect(data.comment.content).toBe("Awesome project idea!");
      expect(data.comment.author).toBeDefined();
    });

    // TC-COMMENT-002: Create nested reply
    it("creates a nested reply to an existing comment", async () => {
      const project = createMockProject({ id: "project-1" });
      mockDb.project.findUnique.mockResolvedValue(project as never);

      const parentComment = createMockComment({ 
        id: "parent-comment",
        projectId: "project-1", // Must match the project
      });
      mockDb.comment.findUnique.mockResolvedValue(parentComment as never);

      const replyComment = createMockComment({
        id: "reply-comment",
        content: "Thanks for the feedback!",
        parentId: "parent-comment",
        projectId: "project-1",
      });
      mockDb.comment.create.mockResolvedValue(replyComment as never);

      const request = createMockRequest("POST", {
        content: "Thanks for the feedback!",
        parentId: "parent-comment",
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.comment.parentId).toBe("parent-comment");
    });

    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = createMockRequest("POST", {
        content: "Test comment",
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when project not found", async () => {
      mockDb.project.findUnique.mockResolvedValue(null);

      const request = createMockRequest("POST", {
        content: "Test comment",
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: "non-existent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found");
    });

    it("returns 400 when content is empty", async () => {
      // Need to mock project exists first since API checks project before validation
      const project = createMockProject({ id: "project-1" });
      mockDb.project.findUnique.mockResolvedValue(project as never);

      const request = createMockRequest("POST", {
        content: "",
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("returns 400 when content exceeds max length", async () => {
      // Need to mock project exists first
      const project = createMockProject({ id: "project-1" });
      mockDb.project.findUnique.mockResolvedValue(project as never);

      const request = createMockRequest("POST", {
        content: "x".repeat(2001), // Max 2000 characters
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("returns 400 when parent comment not found", async () => {
      const project = createMockProject({ id: "project-1" });
      mockDb.project.findUnique.mockResolvedValue(project as never);
      mockDb.comment.findUnique.mockResolvedValue(null);

      const request = createMockRequest("POST", {
        content: "Reply to non-existent",
        parentId: "non-existent-parent",
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: "project-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Parent comment not found");
    });
  });

  describe("PUT /api/comments/[id]", () => {
    // TC-COMMENT-003: Edit own comment (shows edited indicator)
    it("updates own comment and sets isEdited flag", async () => {
      const existingComment = createMockComment({
        id: "comment-1",
        authorId: mockSession.user.id,
      });
      mockDb.comment.findUnique.mockResolvedValue(existingComment as never);

      const updatedComment = {
        ...existingComment,
        content: "Updated content",
        isEdited: true,
        _count: { likes: 0 },
      };
      mockDb.comment.update.mockResolvedValue(updatedComment as never);

      const request = createMockRequest("PUT", {
        content: "Updated content",
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: "comment-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comment.content).toBe("Updated content");
      expect(data.comment.isEdited).toBe(true);
    });

    // TC-COMMENT-006: Cannot edit others' comments
    it("returns 403 when trying to edit another user's comment", async () => {
      const otherUserComment = createMockComment({
        id: "comment-1",
        authorId: "other-user-id",
      });
      mockDb.comment.findUnique.mockResolvedValue(otherUserComment as never);

      const request = createMockRequest("PUT", {
        content: "Trying to edit",
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: "comment-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("returns 404 when comment not found", async () => {
      mockDb.comment.findUnique.mockResolvedValue(null);

      const request = createMockRequest("PUT", {
        content: "Updated content",
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: "non-existent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Comment not found");
    });
  });

  describe("DELETE /api/comments/[id]", () => {
    // TC-COMMENT-004: Delete own comment
    it("deletes own comment successfully", async () => {
      const existingComment = createMockComment({
        id: "comment-1",
        authorId: mockSession.user.id,
      });
      mockDb.comment.findUnique.mockResolvedValue(existingComment as never);

      const request = createMockRequest("DELETE");
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "comment-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    // TC-COMMENT-006: Cannot delete others' comments
    it("returns 403 when trying to delete another user's comment", async () => {
      const otherUserComment = createMockComment({
        id: "comment-1",
        authorId: "other-user-id",
      });
      mockDb.comment.findUnique.mockResolvedValue(otherUserComment as never);

      const request = createMockRequest("DELETE");
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "comment-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("returns 404 when comment not found", async () => {
      mockDb.comment.findUnique.mockResolvedValue(null);

      const request = createMockRequest("DELETE");
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "non-existent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Comment not found");
    });
  });

  describe("POST /api/comments/[id]/like", () => {
    // TC-COMMENT-005: Like/unlike comment
    it("likes a comment when not already liked", async () => {
      const comment = createMockComment({ id: "comment-1", likesCount: 5 });
      mockDb.comment.findUnique.mockResolvedValue({ id: comment.id } as never);
      mockDb.commentLike.findUnique.mockResolvedValue(null); // Not liked yet
      mockDb.commentLike.create.mockResolvedValue({ id: "new-like" } as never);
      mockDb.commentLike.count.mockResolvedValue(6);

      const request = createMockRequest("POST");
      const response = await LIKE_COMMENT(request, {
        params: Promise.resolve({ id: "comment-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.liked).toBe(true);
      expect(data.likesCount).toBe(6);
    });

    it("unlikes a comment when already liked", async () => {
      const comment = createMockComment({ id: "comment-1", likesCount: 5 });
      mockDb.comment.findUnique.mockResolvedValue({ id: comment.id } as never);

      const existingLike = {
        userId: mockSession.user.id,
        commentId: "comment-1",
      };
      mockDb.commentLike.findUnique.mockResolvedValue(existingLike as never);
      mockDb.commentLike.delete.mockResolvedValue({} as never);
      mockDb.commentLike.count.mockResolvedValue(4);

      const request = createMockRequest("POST");
      const response = await LIKE_COMMENT(request, {
        params: Promise.resolve({ id: "comment-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.liked).toBe(false);
      expect(data.likesCount).toBe(4);
    });

    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const request = createMockRequest("POST");
      const response = await LIKE_COMMENT(request, {
        params: Promise.resolve({ id: "comment-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when comment not found", async () => {
      mockDb.comment.findUnique.mockResolvedValue(null);

      const request = createMockRequest("POST");
      const response = await LIKE_COMMENT(request, {
        params: Promise.resolve({ id: "non-existent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Comment not found");
    });
  });
});
