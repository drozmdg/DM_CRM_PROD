/**
 * Supabase client configuration for Sales Dashboard
 *
 * This file provides a configured Supabase client for interacting with the hosted Supabase instance.
 * It handles authentication, data access, and provides utility functions for common operations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
// These should be set in the .env file
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️  Missing Supabase environment variables. Using placeholder values for development.');
  console.warn('⚠️  Database operations will not work until proper credentials are configured.');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Check if the Supabase connection is working
 * @returns Promise that resolves to a boolean indicating if the connection is working
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Checking Supabase connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey ? 'Key is set' : 'Key is not set');

    // Try a simpler query that doesn't require specific tables
    const { data, error } = await supabase.rpc('get_server_time');

    if (error) {
      console.error('Supabase connection error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);

      // Try an alternative method
      console.log('Trying alternative connection method...');
      const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (healthCheck.ok) {
        console.log('Alternative connection method successful');
        return true;
      } else {
        console.error('Alternative connection method failed:', healthCheck.status, healthCheck.statusText);
        return false;
      }
    }

    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Try an alternative method
    try {
      console.log('Trying alternative connection method after error...');
      const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (healthCheck.ok) {
        console.log('Alternative connection method successful');
        return true;
      } else {
        console.error('Alternative connection method failed:', healthCheck.status, healthCheck.statusText);
        return false;
      }
    } catch (fetchError) {
      console.error('Alternative connection method error:', fetchError);
      return false;
    }
  }
};

/**
 * Get the current timestamp in ISO format
 * @returns Current timestamp in ISO format
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Utility function to handle Supabase errors
 * @param error The error object from Supabase
 * @param fallbackMessage A fallback message if the error doesn't have a message
 * @returns A user-friendly error message
 */
export const handleSupabaseError = (error: any, fallbackMessage: string = 'An error occurred'): string => {
  if (error?.message) {
    return error.message;
  }

  if (error?.error_description) {
    return error.error_description;
  }

  return fallbackMessage;
};

export default supabase;
