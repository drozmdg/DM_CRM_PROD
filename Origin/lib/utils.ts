/**
 * Utility functions for the application
 *
 * This file contains general utility functions used throughout the application.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names into a single string using clsx and tailwind-merge
 *
 * This utility function merges class names and handles Tailwind CSS conflicts by
 * using tailwind-merge to resolve them properly.
 *
 * @param inputs - Any number of class values (strings, objects, arrays, etc.)
 * @returns A merged string of class names with Tailwind conflicts resolved
 *
 * @example
 * ```tsx
 * // Basic usage
 * <div className={cn("text-red-500", "bg-blue-500")}>
 *
 * // With conditional classes
 * <div className={cn("text-red-500", isActive && "bg-blue-500")}>
 *
 * // With Tailwind conflict resolution
 * <div className={cn("px-4", "px-6")}>  // px-6 will override px-4
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
