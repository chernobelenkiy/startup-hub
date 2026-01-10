"use client";

import { useState, useCallback, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  projectId: string;
  initialLiked: boolean;
  initialCount: number;
  /** Display variant - "icon" for card view, "full" for detail view */
  variant?: "icon" | "full";
  /** Optional class name for custom styling */
  className?: string;
}

/**
 * Interactive like button with optimistic updates
 * - Shows filled green heart when liked, outline when not
 * - Pulse animation on toggle
 * - Redirects to login if not authenticated
 * - Handles rapid clicking with transition state
 */
export function LikeButton({
  projectId,
  initialLiked,
  initialCount,
  variant = "icon",
  className,
}: LikeButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Optimistic state
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      // Prevent navigation when inside a link
      e.preventDefault();
      e.stopPropagation();

      // Redirect to login if not authenticated
      if (status === "unauthenticated" || !session?.user) {
        router.push("/auth/login");
        return;
      }

      // Prevent rapid clicking
      if (isPending) return;

      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);

      // Optimistic update
      const previousLiked = liked;
      const previousCount = count;
      const newLiked = !liked;
      const newCount = newLiked ? count + 1 : Math.max(0, count - 1);

      setLiked(newLiked);
      setCount(newCount);

      // Make API call with transition
      startTransition(async () => {
        try {
          const response = await fetch(`/api/projects/${projectId}/like`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            // Rollback on error
            setLiked(previousLiked);
            setCount(previousCount);

            if (response.status === 401) {
              router.push("/auth/login");
            }
            return;
          }

          const data = await response.json();
          // Sync with server response
          setLiked(data.liked);
          setCount(data.likesCount);
        } catch (error) {
          // Rollback on network error
          console.error("Failed to toggle like:", error);
          setLiked(previousLiked);
          setCount(previousCount);
        }
      });
    },
    [session, status, router, projectId, liked, count, isPending]
  );

  // Icon-only variant for cards
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || status === "loading"}
        aria-label={liked ? "Unlike project" : "Like project"}
        aria-pressed={liked}
        className={cn(
          "flex items-center gap-1.5 text-muted transition-colors",
          "hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 rounded",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-all duration-200",
            liked && "fill-primary text-primary",
            !liked && "text-muted-foreground",
            isAnimating && "scale-125"
          )}
        />
        <span className="text-xs">{count}</span>
      </button>
    );
  }

  // Full variant with button styling for detail view
  return (
    <Button
      type="button"
      variant={liked ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isPending || status === "loading"}
      aria-label={liked ? "Unlike project" : "Like project"}
      aria-pressed={liked}
      className={cn(
        "gap-2 transition-all duration-200",
        liked && "bg-primary hover:bg-primary/90",
        isAnimating && "scale-105",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all duration-200",
          liked && "fill-current",
          isAnimating && "scale-110"
        )}
      />
      <span>{count}</span>
    </Button>
  );
}

/**
 * Static display version for server components or when interactivity is not needed
 */
export function LikeDisplay({
  count,
  liked = false,
  className,
}: {
  count: number;
  liked?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5 text-muted", className)}>
      <Heart
        className={cn(
          "h-4 w-4",
          liked && "fill-primary text-primary",
          !liked && "text-muted-foreground"
        )}
      />
      <span className="text-xs">{count}</span>
    </div>
  );
}
