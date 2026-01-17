/**
 * Login Rate Limiter
 *
 * In-memory rate limiter specifically for login attempts to prevent brute force attacks.
 * Keys by IP address or email (whichever is provided).
 * 5 failed attempts = 15 minute lockout
 */

import { createInMemoryStore, type StoreEntry } from "@/lib/utils/in-memory-store";

/**
 * Login rate limit configuration
 */
export interface LoginRateLimitConfig {
  /** Maximum failed attempts before lockout */
  maxAttempts: number;
  /** Lockout duration in milliseconds */
  lockoutDurationMs: number;
}

/**
 * Login rate limit status
 */
export interface LoginRateLimitStatus {
  /** Whether the login attempt is allowed */
  allowed: boolean;
  /** Number of remaining attempts before lockout */
  remainingAttempts: number;
  /** When the lockout expires (Unix timestamp in ms), null if not locked */
  lockoutUntil: number | null;
  /** Retry-After value in seconds (only if locked out) */
  retryAfterSeconds?: number;
}

/**
 * Internal storage for login attempt tracking
 */
interface LoginAttemptEntry extends StoreEntry {
  /** Number of failed attempts */
  failedAttempts: number;
  /** When the lockout started (if locked) */
  lockoutStartedAt: number | null;
}

/**
 * Default configuration: 5 failed attempts = 15 minute lockout
 */
export const DEFAULT_LOGIN_RATE_LIMIT: LoginRateLimitConfig = {
  maxAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * In-memory store for login attempt tracking
 * Key: IP address or email
 */
const loginAttemptStore = createInMemoryStore<LoginAttemptEntry>({
  cleanupIntervalMs: 10 * 60 * 1000, // 10 minutes
  entryExpirationMs: 30 * 60 * 1000, // 30 minutes
});

/**
 * Check if a login attempt is allowed for the given identifier
 *
 * @param identifier - IP address or email to check
 * @param config - Rate limit configuration
 * @returns Login rate limit status
 */
export function checkLoginRateLimit(
  identifier: string,
  config: LoginRateLimitConfig = DEFAULT_LOGIN_RATE_LIMIT
): LoginRateLimitStatus {
  const now = Date.now();

  // Get entry (store handles cleanup automatically)
  const entry = loginAttemptStore.get(identifier);

  // No previous attempts
  if (!entry) {
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      lockoutUntil: null,
    };
  }

  // Check if currently locked out
  if (entry.lockoutStartedAt !== null) {
    const lockoutEndsAt = entry.lockoutStartedAt + config.lockoutDurationMs;

    if (now < lockoutEndsAt) {
      // Still locked out
      const retryAfterSeconds = Math.ceil((lockoutEndsAt - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutUntil: lockoutEndsAt,
        retryAfterSeconds,
      };
    }

    // Lockout has expired, reset the entry
    loginAttemptStore.delete(identifier);
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      lockoutUntil: null,
    };
  }

  // Not locked out, return remaining attempts
  const remainingAttempts = Math.max(0, config.maxAttempts - entry.failedAttempts);

  return {
    allowed: remainingAttempts > 0,
    remainingAttempts,
    lockoutUntil: null,
  };
}

/**
 * Record a failed login attempt for the given identifier
 *
 * @param identifier - IP address or email
 * @param config - Rate limit configuration
 * @returns Updated login rate limit status
 */
export function recordFailedLoginAttempt(
  identifier: string,
  config: LoginRateLimitConfig = DEFAULT_LOGIN_RATE_LIMIT
): LoginRateLimitStatus {
  const now = Date.now();

  let entry = loginAttemptStore.get(identifier);

  if (!entry) {
    entry = {
      failedAttempts: 0,
      lockoutStartedAt: null,
      lastAccess: now,
    };
    loginAttemptStore.set(identifier, entry);
  }

  // If lockout has expired, reset the entry
  if (entry.lockoutStartedAt !== null) {
    const lockoutEndsAt = entry.lockoutStartedAt + config.lockoutDurationMs;
    if (now >= lockoutEndsAt) {
      entry.failedAttempts = 0;
      entry.lockoutStartedAt = null;
    }
  }

  // Increment failed attempts
  entry.failedAttempts += 1;
  entry.lastAccess = now;

  // Check if we should start a lockout
  if (entry.failedAttempts >= config.maxAttempts) {
    entry.lockoutStartedAt = now;
    const lockoutEndsAt = now + config.lockoutDurationMs;
    const retryAfterSeconds = Math.ceil(config.lockoutDurationMs / 1000);

    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutUntil: lockoutEndsAt,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - entry.failedAttempts,
    lockoutUntil: null,
  };
}

/**
 * Record a successful login, resetting the attempt counter
 *
 * @param identifier - IP address or email
 */
export function recordSuccessfulLogin(identifier: string): void {
  loginAttemptStore.delete(identifier);
}

/**
 * Reset login rate limit for a given identifier
 * Useful for testing or administrative purposes
 *
 * @param identifier - Identifier to reset
 */
export function resetLoginRateLimit(identifier: string): void {
  loginAttemptStore.delete(identifier);
}

/**
 * Clear all login rate limit entries (useful for testing)
 */
export function clearAllLoginRateLimits(): void {
  loginAttemptStore.clear();
}

/**
 * Format retry time for user-friendly display
 *
 * @param seconds - Seconds until retry is allowed
 * @returns Formatted string like "15 minutes" or "2 minutes 30 seconds"
 */
export function formatRetryTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  return `${minutes} minute${minutes !== 1 ? "s" : ""} ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
}
