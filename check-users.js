/**
 * Check users table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  try {
    console.log('Checking users table...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@test.com');
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Users found:', data);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUsers();