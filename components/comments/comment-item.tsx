"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentLikeButton } from "./comment-like-button";
import { CommentInput } from "./comment-input";
import {
  MoreHorizontal,
  Reply,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Author {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: Author;
  parentId: string | null;
  likesCount: number;
  isLiked: boolean;
  isEdited: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  projectId: string;
  depth?: number;
  onRefresh: () => void;
  onAuthorClick?: (userId: string) => void;
}

const MAX_DEPTH = 3;

export function CommentItem({
  comment,
  projectId,
  depth = 0,
  onRefresh,
  onAuthorClick,
}: CommentItemProps) {
  const { data: session } = useSession();
  const t = useTranslations("project");
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = session?.user?.id === comment.authorId;

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      setEditContent(comment.content);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      toast.success(t("commentUpdated"));
      setIsEditing(false);
      onRefresh();
    } catch {
      toast.error("Failed to update comment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      toast.success(t("commentDeleted"));
      onRefresh();
    } catch {
      toast.error("Failed to delete comment");
      setIsDeleting(false);
    }
  };

  const handleReplySuccess = () => {
    setIsReplying(false);
    onRefresh();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn("group", depth > 0 && "ml-6 pl-4 border-l border-border")}>
      <div className="flex gap-3">
        {/* Avatar */}
        <button
          type="button"
          onClick={() => onAuthorClick?.(comment.author.id)}
          className="size-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
        >
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.name || "User"}
              className="size-full object-cover"
            />
          ) : (
            comment.author.name?.[0]?.toUpperCase() || "?"
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onAuthorClick?.(comment.author.id)}
              className="font-medium text-sm hover:text-primary transition-colors"
            >
              {comment.author.name || "Anonymous"}
            </button>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground">
                ({t("edited")})
              </span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                maxLength={2000}
                autoFocus
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={isSaving || !editContent.trim()}
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  disabled={isSaving}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="mt-2 flex items-center gap-3">
              <CommentLikeButton
                commentId={comment.id}
                initialLiked={comment.isLiked}
                initialCount={comment.likesCount}
              />

              {depth < MAX_DEPTH && (
                <button
                  type="button"
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Reply className="size-3.5" />
                  {t("reply")}
                </button>
              )}

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="size-4 mr-2" />
                      {t("editComment")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-destructive focus:text-destructive"
                    >
                      {isDeleting ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="size-4 mr-2" />
                      )}
                      {t("deleteComment")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply Input */}
          {isReplying && (
            <div className="mt-3">
              <CommentInput
                projectId={projectId}
                parentId={comment.id}
                onSuccess={handleReplySuccess}
                onCancel={() => setIsReplying(false)}
                placeholder={t("replyTo", { name: comment.author.name || "user" })}
                autoFocus
              />
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  projectId={projectId}
                  depth={depth + 1}
                  onRefresh={onRefresh}
                  onAuthorClick={onAuthorClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
