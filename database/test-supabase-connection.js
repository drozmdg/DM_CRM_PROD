#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('🔧 Supabase Connection Test');
console.log(`URL: ${supabaseUrl}`);
console.log(`Service Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 30) + '...' : 'Missing'}`);
console.log(`Anon Key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'Missing'}`);

// Test with anon key first
console.log('\n📋 Testing with anon key...');
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

try {
  const { data, error } = await supabaseAnon.from('customers').select('count').limit(1);
  if (error) {
    console.log('❌ Anon key failed:', error.message);
  } else {
    console.log('✅ Anon key works');
  }
} catch (err) {
  console.log('❌ Anon key error:', err.message);
}

// Test with service key
console.log('\n🔑 Testing with service role key...');
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

try {
  const { data, error } = await supabaseService.from('customers').select('count').limit(1);
  if (error) {
    console.log('❌ Service key failed:', error.message);
  } else {
    console.log('✅ Service key works');
  }
} catch (err) {
  console.log('❌ Service key error:', err.message);
}

// Test listing tables
console.log('\n📋 Testing table access...');
try {
  const { data, error } = await supabaseService.from('customers').select('*').limit(5);
  if (error) {
    console.log('❌ Table access failed:', error.message);
  } else {
    console.log(`✅ Customers table accessible: ${data.length} records found`);
    if (data.length > 0) {
      console.log('   Sample record keys:', Object.keys(data[0]));
    }
  }
} catch (err) {
  console.log('❌ Table access error:', err.message);
}