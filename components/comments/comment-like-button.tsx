"use client";

import { useState, useCallback, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentLikeButtonProps {
  commentId: string;
  initialLiked: boolean;
  initialCount: number;
  className?: string;
}

export function CommentLikeButton({
  commentId,
  initialLiked,
  initialCount,
  className,
}: CommentLikeButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (status === "unauthenticated" || !session?.user) {
        router.push("/auth/login");
        return;
      }

      if (isPending) return;

      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);

      const previousLiked = liked;
      const previousCount = count;
      const newLiked = !liked;
      const newCount = newLiked ? count + 1 : Math.max(0, count - 1);

      setLiked(newLiked);
      setCount(newCount);

      startTransition(async () => {
        try {
          const response = await fetch(`/api/comments/${commentId}/like`, {
            method: "POST",
          });

          if (!response.ok) {
            setLiked(previousLiked);
            setCount(previousCount);
            if (response.status === 401) {
              router.push("/auth/login");
            }
            return;
          }

          const data = await response.json();
          setLiked(data.liked);
          setCount(data.likesCount);
        } catch {
          setLiked(previousLiked);
          setCount(previousCount);
        }
      });
    },
    [session, status, router, commentId, liked, count, isPending]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || status === "loading"}
      aria-label={liked ? "Unlike comment" : "Like comment"}
      className={cn(
        "flex items-center gap-1 text-muted-foreground transition-colors",
        "hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <Heart
        className={cn(
          "size-3.5 transition-all duration-200",
          liked && "fill-primary text-primary",
          isAnimating && "scale-125"
        )}
      />
      {count > 0 && <span className="text-xs">{count}</span>}
    </button>
  );
}
