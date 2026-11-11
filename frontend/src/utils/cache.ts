interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export const cache = {
  get<T>(key: string): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    return entry.data as T;
  },

  set<T>(key: string, data: T): void {
    memoryCache.set(key, { data, timestamp: Date.now() });
  },

  invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      memoryCache.clear();
      return;
    }
    for (const key of memoryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        memoryCache.delete(key);
      }
    }
  }
};

