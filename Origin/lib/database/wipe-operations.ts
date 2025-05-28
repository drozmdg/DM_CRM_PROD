/**
 * Database Wipe Operations
 *
 * This file contains functions for wiping data from the database.
 */

import { supabase } from '../supabase';
import { WIPE_TABLE_ORDER } from './types';
import {
  logMessage,
  getPrimaryKeyColumns,
  getTableRows,
  deleteRowByPrimaryKey,
  deleteRowById
} from './utils';

/**
 * Clears all rows from a table
 * @param tableName The name of the table to clear
 * @returns Promise that resolves to a boolean indicating if the operation was successful
 */
export const clearTable = async (tableName: string): Promise<boolean> => {
  try {
    // First, get all IDs from the table
    let { data, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1000); // Limit to 1000 rows at a time for performance

    if (fetchError) {
      if (fetchError.code === '42703') { // Column does not exist (likely a junction table)
        logMessage(`Table ${tableName} structure is non-standard, trying alternative approach`);

        // For junction tables, we'll try to get the primary key columns
        const pkData = await getPrimaryKeyColumns(tableName);

        if (!pkData || pkData.length === 0) {
          logMessage(`Could not determine primary key for table ${tableName}:`, 'No primary key found');
          return false;
        }

        // Get all rows using the primary key columns
        const rowData = await getTableRows(tableName);

        if (!rowData || rowData.length === 0) {
          logMessage(`Table ${tableName} is already empty`);
          return true;
        }

        // Process rows in batches of 50 for better performance
        const batchSize = 50;
        const batches = [];

        for (let i = 0; i < rowData.length; i += batchSize) {
          batches.push(rowData.slice(i, i + batchSize));
        }

        // Process each batch in sequence
        for (const batch of batches) {
          // Process all rows in the batch in parallel
          const deletePromises = batch.map(row => deleteRowByPrimaryKey(tableName, row, pkData));
          const results = await Promise.all(deletePromises);

          // If any row failed to delete, return false
          if (results.includes(false)) {
            return false;
          }
        }
      } else {
        logMessage(`Failed to fetch rows from table ${tableName}:`, fetchError);
        return false;
      }
    } else {
      // If there are no rows, we can skip this table
      if (!data || data.length === 0) {
        logMessage(`Table ${tableName} is already empty`);
        return true;
      }

      // Process rows in batches of 50 for better performance
      const processBatch = async (rows: any[]) => {
        // Process all rows in the batch in parallel
        const deletePromises = rows.map(row => deleteRowById(tableName, row));
        const results = await Promise.all(deletePromises);

        // If any row failed to delete, return false
        return !results.includes(false);
      };

      // Process the first batch
      const batchSize = 50;
      let currentBatch = data;
      let success = await processBatch(currentBatch);

      if (!success) {
        return false;
      }

      // Process additional batches if needed
      while (currentBatch && currentBatch.length === batchSize) {
        // Get the next batch of rows
        const { data: moreData } = await supabase
          .from(tableName)
          .select('*')
          .limit(batchSize);

        // If there are no more rows, we're done with this table
        if (!moreData || moreData.length === 0) {
          break;
        }

        // Process the next batch
        success = await processBatch(moreData);

        if (!success) {
          return false;
        }

        currentBatch = moreData;
      }
    }

    return true;
  } catch (error) {
    logMessage(`Error clearing table ${tableName}:`, error);
    return false;
  }
};

/**
 * Clears localStorage data
 * @returns Promise that resolves to a boolean indicating if the operation was successful
 */
export const clearLocalStorage = async (): Promise<boolean> => {
  try {
    // Get all localStorage keys
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }

    // Clear all localStorage data
    for (const key of keys) {
      localStorage.removeItem(key);
    }

    logMessage('localStorage data cleared:', keys);
    return true;
  } catch (error) {
    logMessage('Failed to clear localStorage:', error);
    return false;
  }
};

/**
 * Wipes all data from the database
 * @param onProgress Optional callback for progress updates
 * @returns Promise that resolves to a boolean indicating if the operation was successful
 */
export const wipeDatabase = async (
  onProgress?: (table: string, index: number, total: number) => void
): Promise<boolean> => {
  try {
    // Use a different approach that works with Supabase's security restrictions
    try {
      // Group tables by dependency level for parallel processing
      const dependencyLevels = [
        // Level 1: Tables with no dependencies
        ['timeline_events', 'process_timeline_events', 'documents'],
        // Level 2: Tables with dependencies only on level 1
        ['contacts', 'services', 'teams'],
        // Level 3: Tables with dependencies on level 2
        ['processes'],
        // Level 4: Tables with dependencies on level 3
        ['customers']
      ];

      // Process each dependency level in sequence, but tables within a level in parallel
      for (let levelIndex = 0; levelIndex < dependencyLevels.length; levelIndex++) {
        const tablesInLevel = dependencyLevels[levelIndex];
        const levelProgress = levelIndex / dependencyLevels.length;

        // Process all tables in this level in parallel
        const clearPromises = tablesInLevel.map(async (table, tableIndex) => {
          // Call the progress callback if provided
          if (onProgress) {
            const overallIndex = WIPE_TABLE_ORDER.indexOf(table);
            onProgress(table, overallIndex, WIPE_TABLE_ORDER.length);
          }

          try {
            return await clearTable(table);
          } catch (tableError: any) {
            logMessage(`Error clearing table ${table}:`, tableError);
            return false;
          }
        });

        // Wait for all tables in this level to be cleared
        const results = await Promise.all(clearPromises);

        // If any table failed to clear, return false
        if (results.includes(false)) {
          return false;
        }
      }
    } catch (error: any) {
      logMessage('Error executing database wipe:', error);
      return false;
    }

    // Also clear localStorage to ensure the application doesn't load stale data
    await clearLocalStorage();

    // Clear the cache to ensure fresh data is loaded
    try {
      // Import dynamically to avoid circular dependencies
      const { clearCache } = await import('./cache-service');
      clearCache();
    } catch (cacheError) {
      logMessage('Error clearing cache:', cacheError);
      // Continue even if cache clearing fails
    }

    return true;
  } catch (error: any) {
    logMessage('Error wiping database:', error);
    return false;
  }
};
