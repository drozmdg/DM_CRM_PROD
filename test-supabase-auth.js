/**
 * Test Supabase Auth setup
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase Auth setup...');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test login with existing credentials
async function testLogin() {
  try {
    console.log('\n🔍 Testing login with admin@test.com...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'AdminPass123'
    });
    
    if (error) {
      console.error('❌ Login failed:', error.message);
      
      // If user doesn't exist, try to create them
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n🔄 User may not exist. Attempting to create...');
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'admin@test.com',
          password: 'AdminPass123'
        });
        
        if (signUpError) {
          console.error('❌ Sign up failed:', signUpError.message);
        } else {
          console.log('✅ User created successfully!');
          console.log('User ID:', signUpData.user?.id);
          console.log('Email:', signUpData.user?.email);
          
          // Now create user record in users table
          if (signUpData.user) {
            const { error: insertError } = await supabase
              .from('users')
              .insert([{
                id: signUpData.user.id,
                name: 'Admin User',
                email: 'admin@test.com',
                role: 'Admin',
                avatar: null,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);
            
            if (insertError) {
              console.error('❌ Error creating user record:', insertError);
            } else {
              console.log('✅ User record created in users table');
            }
          }
        }
      }
    } else {
      console.log('✅ Login successful!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      console.log('Access Token:', data.session?.access_token ? 'Present' : 'Missing');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testLogin();