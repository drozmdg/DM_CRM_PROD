/**
 * Database Count Operations
 * 
 * This file contains functions for counting records in the database.
 */

import { supabase } from '../supabase';
import { RecordCounts, COUNT_TABLES } from './types';
import { logMessage } from './utils';

/**
 * Gets the count of records in a single table
 * @param tableName The name of the table
 * @returns Promise that resolves to the count of records in the table
 */
export const getTableCount = async (tableName: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      logMessage(`Error getting count for table ${tableName}:`, error);
      return -1; // Indicate error
    }

    return count || 0;
  } catch (error) {
    logMessage(`Error getting count for table ${tableName}:`, error);
    return -1; // Indicate error
  }
};

/**
 * Gets the count of records in each table
 * @returns Promise that resolves to an object with table names as keys and record counts as values
 */
export const getRecordCounts = async (): Promise<RecordCounts> => {
  try {
    const counts: RecordCounts = {} as RecordCounts;

    // Use Promise.all to fetch counts in parallel
    const countPromises = COUNT_TABLES.map(async (table) => {
      const count = await getTableCount(table);
      return { table, count };
    });

    const results = await Promise.all(countPromises);

    // Convert results to the expected format
    for (const { table, count } of results) {
      counts[table] = count;
    }

    return counts;
  } catch (error) {
    logMessage('Error getting record counts:', error);
    return {} as RecordCounts;
  }
};
