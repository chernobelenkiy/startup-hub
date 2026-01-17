/**
 * Generic in-memory store with automatic cleanup
 * Used by rate limiters to avoid duplicate cleanup logic
 */

export interface StoreEntry {
  /** When this entry was last accessed (for cleanup) */
  lastAccess: number;
}

export interface InMemoryStoreConfig {
  /** Cleanup interval in milliseconds */
  cleanupIntervalMs: number;
  /** Entry expiration time in milliseconds */
  entryExpirationMs: number;
}

/**
 * Create an in-memory store with automatic cleanup
 */
export function createInMemoryStore<T extends StoreEntry>(config: InMemoryStoreConfig) {
  const store = new Map<string, T>();
  let lastCleanup = Date.now();

  /**
   * Clean up expired entries from the store
   */
  function cleanupExpiredEntries(): void {
    const now = Date.now();

    // Only run cleanup periodically
    if (now - lastCleanup < config.cleanupIntervalMs) {
      return;
    }

    lastCleanup = now;

    for (const [key, entry] of store.entries()) {
      if (now - entry.lastAccess > config.entryExpirationMs) {
        store.delete(key);
      }
    }
  }

  return {
    get(key: string): T | undefined {
      cleanupExpiredEntries();
      return store.get(key);
    },

    set(key: string, value: T): void {
      cleanupExpiredEntries();
      store.set(key, value);
    },

    delete(key: string): boolean {
      return store.delete(key);
    },

    has(key: string): boolean {
      return store.has(key);
    },

    entries(): IterableIterator<[string, T]> {
      return store.entries();
    },

    /**
     * Force cleanup (useful for testing)
     */
    forceCleanup(): void {
      lastCleanup = 0;
      cleanupExpiredEntries();
    },

    /**
     * Clear all entries (useful for testing)
     */
    clear(): void {
      store.clear();
    },
  };
}
