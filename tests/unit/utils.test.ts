import { describe, it, expect, vi, beforeEach } from "vitest";
import { cn, generateSlug } from "@/lib/utils";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  extractTokenPrefix,
  TOKEN_PREFIX,
  TOKEN_PREFIX_LENGTH,
} from "@/lib/mcp-auth";
import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  DEFAULT_RATE_LIMIT,
} from "@/lib/rate-limit";

/**
 * Unit Tests for Utility Functions
 *
 * Test Cases Covered:
 * - TC-PROJ-006: Slug generation from title
 * - TC-TOKEN-031: Token prefix format
 * - TC-MCP-030: Rate limiting
 */

describe("Utility Functions", () => {
  describe("cn (class name merger)", () => {
    it("merges class names", () => {
      const result = cn("foo", "bar");
      expect(result).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const result = cn("base", isActive && "active");
      expect(result).toContain("active");
    });

    it("handles tailwind merge conflicts", () => {
      // Later class should override earlier one
      const result = cn("p-4", "p-2");
      expect(result).toBe("p-2");
    });

    it("handles undefined and null values", () => {
      const result = cn("foo", undefined, null, "bar");
      expect(result).toBe("foo bar");
    });

    it("handles empty strings", () => {
      const result = cn("foo", "", "bar");
      expect(result).toBe("foo bar");
    });
  });

  describe("generateSlug", () => {
    beforeEach(() => {
      // Reset nanoid mock to return consistent values
      vi.resetModules();
    });

    it("generates URL-safe slug from title", () => {
      const slug = generateSlug("My Amazing Startup");
      // Should be lowercase with hyphens
      expect(slug).toMatch(/^my-amazing-startup-/);
    });

    it("removes special characters", () => {
      const slug = generateSlug("Project! @#$% Name");
      expect(slug).not.toContain("!");
      expect(slug).not.toContain("@");
      expect(slug).not.toContain("#");
      expect(slug).not.toContain("$");
      expect(slug).not.toContain("%");
    });

    it("converts spaces to hyphens", () => {
      const slug = generateSlug("Hello World Project");
      expect(slug).toMatch(/^hello-world-project-/);
    });

    it("converts to lowercase", () => {
      const slug = generateSlug("UPPERCASE TITLE");
      expect(slug).not.toMatch(/[A-Z]/);
    });

    it("trims leading and trailing whitespace", () => {
      const slug = generateSlug("  Trimmed Title  ");
      expect(slug).toMatch(/^trimmed-title-/);
    });

    it("handles multiple consecutive spaces", () => {
      const slug = generateSlug("Multiple   Spaces   Here");
      expect(slug).not.toContain("--");
    });

    it("appends a unique suffix", () => {
      const slug = generateSlug("Test Title");
      // The nanoid mock returns 'x' repeated
      expect(slug).toMatch(/-[a-z0-9_-]+$/);
    });

    it("handles unicode characters by removing them", () => {
      const slug = generateSlug("Project Name");
      // Only alphanumeric and hyphens should remain
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    it("generates consistent format", () => {
      const slug = generateSlug("My Test Project");
      // Should match pattern: base-slug-nanoid
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*-[a-z0-9_-]+$/);
    });
  });
});

describe("MCP Auth Utilities", () => {
  describe("TOKEN_PREFIX", () => {
    // TC-TOKEN-031: Token prefix format
    it("has correct token prefix", () => {
      expect(TOKEN_PREFIX).toBe("sh_live_");
    });

    it("has correct prefix length constant", () => {
      expect(TOKEN_PREFIX_LENGTH).toBe(8);
    });
  });

  describe("extractTokenPrefix", () => {
    it("extracts correct prefix from valid token", () => {
      const token = `${TOKEN_PREFIX}abcdefgh12345678901234567890`;
      const prefix = extractTokenPrefix(token);
      expect(prefix).toBe("abcdefgh");
      expect(prefix.length).toBe(TOKEN_PREFIX_LENGTH);
    });

    it("handles shorter token bodies", () => {
      const token = `${TOKEN_PREFIX}abc`;
      const prefix = extractTokenPrefix(token);
      expect(prefix).toBe("abc");
    });
  });

  describe("hasPermission", () => {
    it("returns true when permission exists", () => {
      expect(hasPermission(["read", "create"], "read")).toBe(true);
      expect(hasPermission(["read", "create"], "create")).toBe(true);
    });

    it("returns false when permission is missing", () => {
      expect(hasPermission(["read"], "create")).toBe(false);
      expect(hasPermission(["read", "create"], "delete")).toBe(false);
    });

    it("handles empty permissions array", () => {
      expect(hasPermission([], "read")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true when at least one permission matches", () => {
      expect(hasAnyPermission(["read"], ["read", "create"])).toBe(true);
      expect(hasAnyPermission(["read", "update"], ["create", "update"])).toBe(
        true
      );
    });

    it("returns false when no permissions match", () => {
      expect(hasAnyPermission(["read"], ["create", "delete"])).toBe(false);
    });

    it("handles empty arrays", () => {
      expect(hasAnyPermission([], ["read"])).toBe(false);
      expect(hasAnyPermission(["read"], [])).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns true when all permissions match", () => {
      expect(hasAllPermissions(["read", "create"], ["read", "create"])).toBe(
        true
      );
      expect(
        hasAllPermissions(["read", "create", "update"], ["read", "create"])
      ).toBe(true);
    });

    it("returns false when some permissions are missing", () => {
      expect(hasAllPermissions(["read"], ["read", "create"])).toBe(false);
    });

    it("returns true for empty required array", () => {
      expect(hasAllPermissions(["read"], [])).toBe(true);
    });
  });
});

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Reset rate limit state between tests
    resetRateLimit("test-token");
  });

  describe("checkRateLimit", () => {
    // TC-MCP-030: Rate limit of 100 requests per minute
    it("allows requests within limit", () => {
      const result = checkRateLimit("test-token");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(DEFAULT_RATE_LIMIT.limit - 1);
      expect(result.limit).toBe(DEFAULT_RATE_LIMIT.limit);
    });

    it("tracks request count correctly", () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-token");
      }

      const status = getRateLimitStatus("test-token");
      expect(status.remaining).toBe(DEFAULT_RATE_LIMIT.limit - 5);
    });

    it("blocks requests when limit exceeded", () => {
      // Exhaust the rate limit
      for (let i = 0; i < DEFAULT_RATE_LIMIT.limit; i++) {
        checkRateLimit("test-token");
      }

      const result = checkRateLimit("test-token");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("uses custom rate limit config", () => {
      const customConfig = { limit: 5, windowMs: 1000 };

      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-custom", customConfig);
      }

      const result = checkRateLimit("test-custom", customConfig);
      expect(result.allowed).toBe(false);

      // Cleanup
      resetRateLimit("test-custom");
    });

    it("isolates rate limits by identifier", () => {
      // Exhaust limit for token1
      for (let i = 0; i < DEFAULT_RATE_LIMIT.limit; i++) {
        checkRateLimit("token1");
      }

      // token2 should still be allowed
      const result = checkRateLimit("token2");
      expect(result.allowed).toBe(true);

      // Cleanup
      resetRateLimit("token1");
      resetRateLimit("token2");
    });
  });

  describe("resetRateLimit", () => {
    it("resets rate limit for identifier", () => {
      // Make some requests
      for (let i = 0; i < 10; i++) {
        checkRateLimit("test-token");
      }

      // Reset
      resetRateLimit("test-token");

      // Should be fresh
      const status = getRateLimitStatus("test-token");
      expect(status.remaining).toBe(DEFAULT_RATE_LIMIT.limit);
    });
  });

  describe("getRateLimitStatus", () => {
    it("returns status without incrementing", () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-token");
      }

      const status1 = getRateLimitStatus("test-token");
      const status2 = getRateLimitStatus("test-token");

      // Both should return same remaining count
      expect(status1.remaining).toBe(status2.remaining);
      expect(status1.remaining).toBe(DEFAULT_RATE_LIMIT.limit - 5);
    });

    it("returns full limit for new identifier", () => {
      const status = getRateLimitStatus("new-token");

      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(DEFAULT_RATE_LIMIT.limit);
    });
  });
});
