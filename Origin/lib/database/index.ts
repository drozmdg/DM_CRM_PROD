/**
 * Database Service Index
 *
 * This file re-exports all database service functionality for easier imports.
 */

// Export types
export * from './types';

// Export utility functions
export * from './utils';

// Export count operations
export * from './count-operations';

// Export wipe operations
export * from './wipe-operations';

// Export notifications
export * from './notifications';

// Export cache service
export * from './cache-service';

// Import dependencies
import { wipeDatabase } from './wipe-operations';
import { getRecordCounts } from './count-operations';
import { showLoading, showSuccess, showError } from './notifications';
import {
  setCacheConfig,
  getCacheConfig,
  clearCache,
  invalidateTableCache,
  fetchWithCache
} from './cache-service';
import { supabase } from '../supabase';

/**
 * Service for database administration operations
 */
export const DatabaseService = {
  /**
   * Wipes all data from the database
   * @returns Promise<boolean> - True if successful, false otherwise
   */
  async wipeDatabase(): Promise<boolean> {
    try {
      // Show a toast to indicate the operation has started
      showLoading('Wiping database...');

      // Wipe the database
      const success = await wipeDatabase();

      if (success) {
        // Show a success toast
        showSuccess('Database wiped successfully');

        // Clear the cache
        clearCache();

        // Reload the page to ensure the application loads fresh data
        window.location.reload();
      }

      return success;
    } catch (error: any) {
      showError('Error wiping database', error);
      return false;
    }
  },

  /**
   * Gets the count of records in each table
   * @returns Promise<Record<string, number>> - Object with table names as keys and record counts as values
   */
  async getRecordCounts(): Promise<Record<string, number>> {
    try {
      // Use cache with a short TTL for record counts
      const { data, error } = await fetchWithCache<Record<string, number>>(
        'record_counts',
        {},
        { ttl: 30000 } // 30 seconds TTL
      );

      if (error || !data) {
        // If there's an error or no data, fall back to the original implementation
        return await getRecordCounts();
      }

      return data;
    } catch (error) {
      showError('Error getting record counts', error);
      return {};
    }
  },

  /**
   * Configures the cache service
   * @param config Cache configuration options
   */
  configureCache(config: {
    enabled?: boolean;
    defaultTTL?: number;
    maxEntries?: number;
  }): void {
    setCacheConfig(config);
  },

  /**
   * Gets the current cache configuration
   * @returns The current cache configuration
   */
  getCacheConfig(): {
    enabled: boolean;
    defaultTTL: number;
    maxEntries: number;
  } {
    return getCacheConfig();
  },

  /**
   * Clears the entire cache
   */
  clearCache(): void {
    clearCache();
  },

  /**
   * Invalidates cache entries for a specific table
   * @param table The table name
   */
  invalidateTableCache(table: string): void {
    invalidateTableCache(table);
  },

  /**
   * Fetches data from a table with caching and retry logic
   * @param table The table name
   * @param query The query parameters
   * @param options Options for caching and retries
   * @returns The query result
   */
  async fetchWithCache<T>(
    table: string,
    query: any = {},
    options: {
      useCache?: boolean;
      ttl?: number;
      maxRetries?: number;
      retryDelay?: number;
    } = {}
  ): Promise<{ data: T | null; error: any }> {
    return fetchWithCache<T>(table, query, options);
  }
};
