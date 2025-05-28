/**
 * Database Notifications
 * 
 * This file contains functions for displaying notifications related to database operations.
 */

import { toast } from 'sonner';

/**
 * Shows a loading toast
 * @param message The message to display
 * @returns The toast ID
 */
export const showLoading = (message: string): string => {
  return toast.loading(message);
};

/**
 * Shows a success toast
 * @param message The message to display
 * @returns The toast ID
 */
export const showSuccess = (message: string): string => {
  return toast.success(message);
};

/**
 * Shows an error toast
 * @param message The message to display
 * @param error Optional error object
 * @returns The toast ID
 */
export const showError = (message: string, error?: any): string => {
  const errorMessage = error?.message || 'Unknown error';
  return toast.error(`${message}: ${errorMessage}`);
};

/**
 * Shows a toast for a table operation error
 * @param table The table name
 * @param operation The operation being performed
 * @param error The error object
 * @returns The toast ID
 */
export const showTableError = (table: string, operation: string, error: any): string => {
  const errorMessage = error?.message || 'Unknown error';
  return toast.error(`Error ${operation} table ${table}: ${errorMessage}`);
};

/**
 * Shows a toast for database wipe progress
 * @param table The current table being wiped
 * @param index The index of the current table
 * @param total The total number of tables
 * @returns The toast ID
 */
export const showWipeProgress = (table: string, index: number, total: number): string => {
  const progress = Math.round((index / total) * 100);
  return toast.loading(`Wiping table ${table}... (${progress}%)`);
};
