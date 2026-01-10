/**
 * Simple in-memory rate limiter for MCP API endpoints
 *
 * Implements a sliding window rate limiting algorithm.
 * Can be upgraded to Upstash Redis for production/distributed environments.
 */

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

/**
 * Rate limit status returned after checking
 */
export interface RateLimitStatus {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in the current window */
  remaining: number;
  /** Total limit for the window */
  limit: number;
  /** When the rate limit resets (Unix timestamp in seconds) */
  resetAt: number;
  /** Retry-After value in seconds (only if not allowed) */
  retryAfter?: number;
}

/**
 * Internal storage for rate limit tracking
 */
interface RateLimitEntry {
  /** Request timestamps within the window */
  timestamps: number[];
  /** When this entry was last accessed (for cleanup) */
  lastAccess: number;
}

/**
 * Default rate limit: 100 requests per minute per token
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * In-memory store for rate limit data
 * Key: token ID (not the actual token for security)
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleanup interval in milliseconds (5 minutes)
 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Entry expiration time in milliseconds (10 minutes)
 */
const ENTRY_EXPIRATION_MS = 10 * 60 * 1000;

/**
 * Last cleanup timestamp
 */
let lastCleanup = Date.now();

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  // Only run cleanup periodically
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanup = now;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastAccess > ENTRY_EXPIRATION_MS) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for a given identifier (typically token ID)
 *
 * @param identifier - Unique identifier for rate limiting (e.g., token ID)
 * @param config - Rate limit configuration
 * @returns Rate limit status
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): RateLimitStatus {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Cleanup old entries periodically
  cleanupExpiredEntries();

  // Get or create entry
  let entry = rateLimitStore.get(identifier);

  if (!entry) {
    entry = {
      timestamps: [],
      lastAccess: now,
    };
    rateLimitStore.set(identifier, entry);
  }

  // Update last access
  entry.lastAccess = now;

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  // Calculate reset time (end of current window from first request)
  const resetAt = entry.timestamps.length > 0
    ? Math.ceil((entry.timestamps[0] + config.windowMs) / 1000)
    : Math.ceil((now + config.windowMs) / 1000);

  // Check if limit exceeded
  if (entry.timestamps.length >= config.limit) {
    const retryAfter = Math.ceil((entry.timestamps[0] + config.windowMs - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      limit: config.limit,
      resetAt,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  // Add current request timestamp
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.limit - entry.timestamps.length,
    limit: config.limit,
    resetAt,
  };
}

/**
 * Reset rate limit for a given identifier
 * Useful for testing or administrative purposes
 *
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status without incrementing
 *
 * @param identifier - Unique identifier
 * @param config - Rate limit configuration
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): RateLimitStatus {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    return {
      allowed: true,
      remaining: config.limit,
      limit: config.limit,
      resetAt: Math.ceil((now + config.windowMs) / 1000),
    };
  }

  // Count requests within current window
  const validTimestamps = entry.timestamps.filter((ts) => ts > windowStart);
  const remaining = Math.max(0, config.limit - validTimestamps.length);

  const resetAt = validTimestamps.length > 0
    ? Math.ceil((validTimestamps[0] + config.windowMs) / 1000)
    : Math.ceil((now + config.windowMs) / 1000);

  return {
    allowed: remaining > 0,
    remaining,
    limit: config.limit,
    resetAt,
  };
}

/**
 * Create rate limit headers for HTTP response
 *
 * @param status - Rate limit status
 * @returns Headers object with rate limit information
 */
export function createRateLimitHeaders(status: RateLimitStatus): Headers {
  const headers = new Headers();

  headers.set("X-RateLimit-Limit", status.limit.toString());
  headers.set("X-RateLimit-Remaining", status.remaining.toString());
  headers.set("X-RateLimit-Reset", status.resetAt.toString());

  if (!status.allowed && status.retryAfter) {
    headers.set("Retry-After", status.retryAfter.toString());
  }

  return headers;
}
