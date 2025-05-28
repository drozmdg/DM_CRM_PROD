/**
 * Migration Utilities
 * 
 * This file contains common utility functions used by the migration process.
 */

import { getCurrentTimestamp } from '../supabase';

/**
 * Get data from localStorage
 * @param key The localStorage key
 * @returns The parsed data or null if not found
 */
export const getLocalStorageData = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting data from localStorage for key ${key}:`, error);
    return null;
  }
};

/**
 * Transform a date string to ISO format
 * @param dateStr The date string to transform
 * @returns The date in ISO format or null if invalid
 */
export const transformDate = (dateStr: string | undefined | null): string | null => {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (error) {
    console.error('Error transforming date:', error);
    return null;
  }
};

/**
 * Get current timestamp in YYYY-MM-DD format
 * @returns Current date in YYYY-MM-DD format
 */
export const getCurrentDate = (): string => {
  return getCurrentTimestamp().split('T')[0];
};
