/**
 * Database Utilities
 *
 * This file contains utility functions for database operations.
 */

import { supabase } from '../supabase';
import {
  logError,
  ErrorType,
  createAppError,
  handleError
} from '@/utils/error-utils';

/**
 * Shows a console log message with a timestamp
 * @param message The message to log
 * @param data Optional data to log
 */
export const logMessage = (message: string, data?: any): void => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
};

/**
 * Gets the primary key columns for a table
 * @param tableName The name of the table
 * @returns Promise that resolves to an array of primary key column names
 */
export const getPrimaryKeyColumns = async (tableName: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.rpc('get_primary_key_columns', {
      table_name: tableName
    });

    if (error) {
      throw createAppError(
        ErrorType.DATABASE_QUERY,
        `Failed to get primary key columns for table ${tableName}`,
        error
      );
    }

    return data || [];
  } catch (error) {
    handleError(
      error,
      'database/utils/getPrimaryKeyColumns',
      `Failed to get primary key columns for table ${tableName}`,
      false // Don't show toast for this operation
    );
    return [];
  }
};

/**
 * Checks if a table exists in the database
 * @param tableName The name of the table to check
 * @returns Promise that resolves to a boolean indicating if the table exists
 */
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('table_exists', {
      table_name: tableName
    });

    if (error) {
      throw createAppError(
        ErrorType.DATABASE_QUERY,
        `Failed to check if table ${tableName} exists`,
        error
      );
    }

    return !!data;
  } catch (error) {
    handleError(
      error,
      'database/utils/tableExists',
      `Failed to check if table ${tableName} exists`,
      false // Don't show toast for this operation
    );
    return false;
  }
};

/**
 * Gets all rows from a table
 * @param tableName The name of the table
 * @param limit The maximum number of rows to return
 * @returns Promise that resolves to an array of rows
 */
export const getTableRows = async (tableName: string, limit: number = 1000): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);

    if (error) {
      throw createAppError(
        ErrorType.DATABASE_QUERY,
        `Failed to get rows from table ${tableName}`,
        error
      );
    }

    return data || [];
  } catch (error) {
    handleError(
      error,
      'database/utils/getTableRows',
      `Failed to get rows from table ${tableName}`,
      false // Don't show toast for this operation
    );
    return [];
  }
};

/**
 * Deletes a row from a table using its primary key
 * @param tableName The name of the table
 * @param row The row to delete
 * @param primaryKeyColumns The primary key columns
 * @returns Promise that resolves to a boolean indicating if the deletion was successful
 */
export const deleteRowByPrimaryKey = async (
  tableName: string,
  row: any,
  primaryKeyColumns: string[]
): Promise<boolean> => {
  try {
    const deleteQuery = supabase.from(tableName).delete();

    // Add a filter for each primary key column
    for (const pkColumn of primaryKeyColumns) {
      deleteQuery.eq(pkColumn, row[pkColumn]);
    }

    const { error } = await deleteQuery;

    if (error) {
      throw createAppError(
        ErrorType.DATABASE_QUERY,
        `Failed to delete row from table ${tableName}`,
        error,
        { tableName, primaryKeyColumns, row }
      );
    }

    return true;
  } catch (error) {
    handleError(
      error,
      'database/utils/deleteRowByPrimaryKey',
      `Failed to delete row from table ${tableName}`,
      true // Show toast for this operation
    );
    return false;
  }
};

/**
 * Deletes a row from a table using its ID
 * @param tableName The name of the table
 * @param row The row to delete
 * @returns Promise that resolves to a boolean indicating if the deletion was successful
 */
export const deleteRowById = async (tableName: string, row: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', row.id);

    if (error) {
      throw createAppError(
        ErrorType.DATABASE_QUERY,
        `Failed to delete row from table ${tableName}`,
        error,
        { tableName, rowId: row.id }
      );
    }

    return true;
  } catch (error) {
    handleError(
      error,
      'database/utils/deleteRowById',
      `Failed to delete row from table ${tableName}`,
      true // Show toast for this operation
    );
    return false;
  }
};
