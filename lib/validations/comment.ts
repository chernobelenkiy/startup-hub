import { z } from "zod";

/**
 * Create Comment Schema
 * Validates new comment creation requests
 */
export const createCommentSchema = z.object({
  content: z.string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be at most 2000 characters"),
  parentId: z.string().min(1).optional().nullable(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/**
 * Update Comment Schema
 * Validates comment update requests
 */
export const updateCommentSchema = z.object({
  content: z.string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be at most 2000 characters"),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
