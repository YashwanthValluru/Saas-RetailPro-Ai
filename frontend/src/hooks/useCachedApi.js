import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import cacheService from '../services/cacheService';

const API = '/api';

/**
 * Hook for cached API calls with stale-while-revalidate strategy.
 * Returns cached data immediately, then refreshes silently in background.
 *
 * @param {string} tenantId - Current user's tenant ID
 * @param {string} endpoint - API endpoint (e.g., '/inventory/products')
 * @param {object} params - Query parameters
 * @param {object} options - { ttl, enabled, memoryOnly, cacheKey }
 * @returns {{ data, loading, error, refresh, fromCache }}
 */
export function useCachedApi(tenantId, endpoint, params = {}, options = {}) {
  const { ttl = 60, enabled = true, memoryOnly = false, cacheKey: customCacheKey } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const abortRef = useRef(null);

  // Build a stable cache key from endpoint + params
  const cacheKey = customCacheKey || `${endpoint}:${JSON.stringify(params)}`;

  const fetchData = useCallback(async (skipCache = false) => {
    if (!enabled || !tenantId) return;

    // 1. Try cache first (unless explicitly skipping)
    if (!skipCache) {
      const cached = cacheService.get(tenantId, cacheKey);
      if (cached !== null) {
        setData(cached);
        setFromCache(true);
        setLoading(false);
        // Still fetch fresh data in background (stale-while-revalidate)
      }
    }

    // 2. Fetch fresh data
    try {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const { data: freshData } = await axios.get(`${API}${endpoint}`, {
        params,
        withCredentials: true,
        signal: controller.signal,
      });

      setData(freshData);
      setFromCache(false);
      setError(null);

      // Cache the fresh data
      cacheService.set(tenantId, cacheKey, freshData, ttl, memoryOnly);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(err);
        // If we have cached data, keep showing it
        if (!data) setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, endpoint, JSON.stringify(params), enabled, ttl, memoryOnly, cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refresh, fromCache };
}

/**
 * Imperatively cached API call (not a hook). For one-off calls.
 * Returns cached result if available, otherwise fetches and caches.
 */
export async function cachedApiCall(tenantId, endpoint, params = {}, ttl = 60) {
  const cacheKey = `${endpoint}:${JSON.stringify(params)}`;

  // Check cache
  const cached = cacheService.get(tenantId, cacheKey);
  if (cached !== null) return { data: cached, fromCache: true };

  // Fetch fresh
  const { data } = await axios.get(`${API}${endpoint}`, { params, withCredentials: true });
  cacheService.set(tenantId, cacheKey, data, ttl);
  return { data, fromCache: false };
}
