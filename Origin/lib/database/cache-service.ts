/**
 * Database Cache Service
 * 
 * This file contains functions for caching database results and implementing retry logic.
 */

import { supabase } from '../supabase';
import { logMessage } from './utils';

// Cache storage
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache configuration
interface CacheConfig {
  enabled: boolean;
  defaultTTL: number; // Time to live in milliseconds
  maxEntries: number;
}

// Cache storage
const cache: Map<string, CacheEntry<any>> = new Map();

// Default cache configuration
const cacheConfig: CacheConfig = {
  enabled: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxEntries: 100
};

/**
 * Generates a cache key from the query parameters
 * @param table The table name
 * @param query The query parameters
 * @returns A string cache key
 */
export const generateCacheKey = (table: string, query: any = {}): string => {
  return `${table}:${JSON.stringify(query)}`;
};

/**
 * Sets the cache configuration
 * @param config The cache configuration
 */
export const setCacheConfig = (config: Partial<CacheConfig>): void => {
  Object.assign(cacheConfig, config);
};

/**
 * Gets the current cache configuration
 * @returns The current cache configuration
 */
export const getCacheConfig = (): CacheConfig => {
  return { ...cacheConfig };
};

/**
 * Clears the entire cache
 */
export const clearCache = (): void => {
  cache.clear();
  logMessage('Cache cleared');
};

/**
 * Invalidates cache entries for a specific table
 * @param table The table name
 */
export const invalidateTableCache = (table: string): void => {
  const keysToDelete: string[] = [];
  
  // Find all keys that start with the table name
  for (const key of cache.keys()) {
    if (key.startsWith(`${table}:`)) {
      keysToDelete.push(key);
    }
  }
  
  // Delete the keys
  for (const key of keysToDelete) {
    cache.delete(key);
  }
  
  logMessage(`Cache invalidated for table: ${table}`);
};

/**
 * Gets a value from the cache
 * @param key The cache key
 * @returns The cached value or undefined if not found
 */
export const getCachedValue = <T>(key: string): T | undefined => {
  if (!cacheConfig.enabled) {
    return undefined;
  }
  
  const entry = cache.get(key);
  
  if (!entry) {
    return undefined;
  }
  
  // Check if the entry has expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  
  return entry.data;
};

/**
 * Sets a value in the cache
 * @param key The cache key
 * @param value The value to cache
 * @param ttl Optional time to live in milliseconds
 */
export const setCachedValue = <T>(key: string, value: T, ttl?: number): void => {
  if (!cacheConfig.enabled) {
    return;
  }
  
  // If the cache is full, remove the oldest entry
  if (cache.size >= cacheConfig.maxEntries) {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [k, entry] of cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = k;
      }
    }
    
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
  
  const timestamp = Date.now();
  const actualTTL = ttl || cacheConfig.defaultTTL;
  
  cache.set(key, {
    data: value,
    timestamp,
    expiresAt: timestamp + actualTTL
  });
};

/**
 * Executes a database query with caching and retry logic
 * @param queryFn Function that returns a Supabase query
 * @param cacheKey The cache key
 * @param options Options for caching and retries
 * @returns The query result
 */
export const executeQuery = async <T>(
  queryFn: () => any,
  cacheKey: string,
  options: {
    useCache?: boolean;
    ttl?: number;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<{ data: T | null; error: any }> => {
  const {
    useCache = true,
    ttl,
    maxRetries = 3,
    retryDelay = 1000
  } = options;
  
  // Check cache first if enabled
  if (useCache && cacheConfig.enabled) {
    const cachedValue = getCachedValue<{ data: T | null; error: any }>(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }
  }
  
  let retries = 0;
  let lastError: any = null;
  
  while (retries <= maxRetries) {
    try {
      const query = queryFn();
      const result = await query;
      
      // Cache the result if successful and caching is enabled
      if (!result.error && useCache && cacheConfig.enabled) {
        setCachedValue(cacheKey, result, ttl);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      retries++;
      
      if (retries <= maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
      }
    }
  }
  
  // Return error after all retries have failed
  return { data: null, error: lastError };
};

/**
 * Fetches data from a table with caching and retry logic
 * @param table The table name
 * @param query The query parameters
 * @param options Options for caching and retries
 * @returns The query result
 */
export const fetchWithCache = async <T>(
  table: string,
  query: any = {},
  options: {
    useCache?: boolean;
    ttl?: number;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<{ data: T | null; error: any }> => {
  const cacheKey = generateCacheKey(table, query);
  
  return executeQuery<T>(
    () => {
      let supabaseQuery = supabase.from(table).select('*');
      
      // Apply filters, limits, etc. from the query object
      if (query.filter) {
        for (const [column, value] of Object.entries(query.filter)) {
          supabaseQuery = supabaseQuery.eq(column, value);
        }
      }
      
      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }
      
      if (query.order) {
        supabaseQuery = supabaseQuery.order(query.order.column, {
          ascending: query.order.ascending
        });
      }
      
      return supabaseQuery;
    },
    cacheKey,
    options
  );
};
