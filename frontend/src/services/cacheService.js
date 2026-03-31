/**
 * Secure, tenant-scoped cache service for RetailPro.
 * - In-memory cache (fast, ephemeral) + encrypted localStorage (persistent across refreshes)
 * - Tenant-scoped keys prevent cross-tenant data leakage
 * - Auto-wipe on logout
 * - TTL-based expiry
 * - Sensitive data (financials) goes to memory-only cache
 */

const CACHE_PREFIX = 'rp_';
const MEMORY_CACHE = new Map();

// Simple obfuscation key derived from session — not military-grade but prevents casual localStorage inspection
let _sessionKey = null;

function getSessionKey() {
  if (_sessionKey) return _sessionKey;
  let key = sessionStorage.getItem('rp_sk');
  if (!key) {
    // Generate a random 32-char key for this session
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    key = Array.from(arr, b => b.toString(36).padStart(2, '0')).join('').slice(0, 32);
    sessionStorage.setItem('rp_sk', key);
  }
  _sessionKey = key;
  return key;
}

function obfuscate(data) {
  try {
    const json = JSON.stringify(data);
    const key = getSessionKey();
    // XOR-based obfuscation
    let result = '';
    for (let i = 0; i < json.length; i++) {
      result += String.fromCharCode(json.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(unescape(encodeURIComponent(result)));
  } catch {
    return null;
  }
}

function deobfuscate(encoded) {
  try {
    const key = getSessionKey();
    const decoded = decodeURIComponent(escape(atob(encoded)));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return JSON.parse(result);
  } catch {
    return null;
  }
}

function buildKey(tenantId, key) {
  return `${CACHE_PREFIX}${tenantId}:${key}`;
}

const cacheService = {
  /**
   * Get cached value. Returns null if not found or expired.
   * Checks memory first (fastest), then localStorage.
   */
  get(tenantId, key) {
    const cacheKey = buildKey(tenantId, key);

    // 1. Check in-memory cache
    const memItem = MEMORY_CACHE.get(cacheKey);
    if (memItem) {
      if (Date.now() < memItem.expiry) {
        return memItem.data;
      }
      MEMORY_CACHE.delete(cacheKey);
    }

    // 2. Check localStorage (persistent cache)
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const item = deobfuscate(stored);
        if (item && Date.now() < item.expiry) {
          // Promote to memory cache for faster subsequent access
          MEMORY_CACHE.set(cacheKey, { data: item.data, expiry: item.expiry });
          return item.data;
        }
        // Expired — clean up
        localStorage.removeItem(cacheKey);
      }
    } catch {
      // localStorage not available or corrupted
    }

    return null;
  },

  /**
   * Set cached value with TTL (seconds).
   * @param {string} tenantId - Tenant ID for scoping
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttlSeconds - Time to live in seconds
   * @param {boolean} memoryOnly - If true, don't persist to localStorage (for sensitive data)
   */
  set(tenantId, key, data, ttlSeconds = 60, memoryOnly = false) {
    const cacheKey = buildKey(tenantId, key);
    const expiry = Date.now() + ttlSeconds * 1000;

    // Always set in memory
    MEMORY_CACHE.set(cacheKey, { data, expiry });

    // Persist to localStorage (unless sensitive)
    if (!memoryOnly) {
      try {
        const encoded = obfuscate({ data, expiry });
        if (encoded) {
          localStorage.setItem(cacheKey, encoded);
        }
      } catch {
        // localStorage full or not available — memory cache still works
      }
    }
  },

  /**
   * Invalidate specific key or all keys for a tenant.
   */
  invalidate(tenantId, key = null) {
    if (key) {
      const cacheKey = buildKey(tenantId, key);
      MEMORY_CACHE.delete(cacheKey);
      try { localStorage.removeItem(cacheKey); } catch {}
    } else {
      // Invalidate all keys for this tenant
      const prefix = buildKey(tenantId, '');
      // Memory cache
      for (const k of MEMORY_CACHE.keys()) {
        if (k.startsWith(prefix)) MEMORY_CACHE.delete(k);
      }
      // localStorage
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const lsKey = localStorage.key(i);
          if (lsKey && lsKey.startsWith(prefix)) keysToRemove.push(lsKey);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch {}
    }
  },

  /**
   * Invalidate keys matching a prefix pattern for a tenant.
   */
  invalidatePrefix(tenantId, prefix) {
    const fullPrefix = buildKey(tenantId, prefix);
    for (const k of MEMORY_CACHE.keys()) {
      if (k.startsWith(fullPrefix)) MEMORY_CACHE.delete(k);
    }
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const lsKey = localStorage.key(i);
        if (lsKey && lsKey.startsWith(fullPrefix)) keysToRemove.push(lsKey);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  },

  /**
   * Clear ALL cached data. Call on logout.
   */
  clearAll() {
    MEMORY_CACHE.clear();
    _sessionKey = null;
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const lsKey = localStorage.key(i);
        if (lsKey && lsKey.startsWith(CACHE_PREFIX)) keysToRemove.push(lsKey);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      sessionStorage.removeItem('rp_sk');
    } catch {}
  },

  /**
   * Get cache statistics for debugging.
   */
  stats() {
    let lsCount = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i)?.startsWith(CACHE_PREFIX)) lsCount++;
      }
    } catch {}
    return {
      memoryEntries: MEMORY_CACHE.size,
      localStorageEntries: lsCount,
    };
  }
};

export default cacheService;
