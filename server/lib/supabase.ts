/**
 * Supabase Database Client with Authentication
 * Provides database connectivity and authentication services
 */

import { createClient } from '@supabase/supabase-js';

// Validate required environment variables
function validateEnvironmentVariables(): void {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env file and ensure all Supabase credentials are configured.'
    );
  }

  // Validate URL format
  const supabaseUrl = process.env.SUPABASE_URL!;
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    throw new Error(
      'Invalid SUPABASE_URL format. Expected: https://your-project.supabase.co'
    );
  }

  // Validate key formats
  const anonKey = process.env.SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!anonKey.startsWith('eyJ') || !serviceKey.startsWith('eyJ')) {
    throw new Error(
      'Invalid Supabase key format. Keys should be JWT tokens starting with "eyJ"'
    );
  }

  if (anonKey === serviceKey) {
    throw new Error(
      'SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY cannot be the same. ' +
      'Please use the correct service role key from your Supabase dashboard.'
    );
  }
}

// Validate environment on module load
// validateEnvironmentVariables(); // Temporarily disabled to test

// Initialize Supabase client with authentication enabled
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true, // Enable session persistence for server-side auth
      autoRefreshToken: true, // Enable auto token refresh
      detectSessionInUrl: false // Disable URL detection for server-side
    }
  }
);

// Initialize admin client for user management operations
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Check if Supabase database connection is working
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('⚠️  Missing Supabase credentials');
      return false;
    }

    // Simple query to test connection
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

/**
 * Generic error handler for Supabase operations
 */
export function handleSupabaseError(error: any): Error {
  if (error?.message) {
    return new Error(`Database error: ${error.message}`);
  }
  return new Error('Unknown database error');
}
