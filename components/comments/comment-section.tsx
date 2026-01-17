"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CommentInput } from "./comment-input";
import { CommentItem, type Comment } from "./comment-item";
import { UserProfileModal } from "@/components/profile";
import { MessageSquare, Loader2 } from "lucide-react";

interface CommentSectionProps {
  projectId: string;
}

export function CommentSection({ projectId }: CommentSectionProps) {
  const t = useTranslations("project");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`);
      if (!response.ok) throw new Error("Failed to load comments");
      const data = await response.json();
      setComments(data.comments);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleRefresh = () => {
    fetchComments();
  };

  const totalComments = comments.reduce((acc, comment) => {
    let count = 1;
    if (comment.replies) {
      count += comment.replies.reduce((replyAcc, reply) => {
        let replyCount = 1;
        if (reply.replies) {
          replyCount += reply.replies.length;
        }
        return replyAcc + replyCount;
      }, 0);
    }
    return acc + count;
  }, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            <h2 className="text-lg font-semibold">
              {t("comments")}
              {totalComments > 0 && (
                <span className="ml-2 text-muted-foreground font-normal">
                  ({totalComments})
                </span>
              )}
            </h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comment Input */}
          <CommentInput projectId={projectId} onSuccess={handleRefresh} />

          {/* Comments List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              {error}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("noComments")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("beFirstToComment")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  projectId={projectId}
                  onRefresh={handleRefresh}
                  onAuthorClick={setProfileUserId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Profile Modal */}
      <UserProfileModal
        userId={profileUserId}
        open={!!profileUserId}
        onOpenChange={(open) => !open && setProfileUserId(null)}
      />
    </>
  );
}
