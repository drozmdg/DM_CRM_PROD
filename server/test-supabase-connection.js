/**
 * Supabase Connection Test Script
 * Tests the database connection and verifies required tables exist
 */

import 'dotenv/config';
import { supabase, checkSupabaseConnection } from './lib/supabase.ts';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Check basic connection
    const isConnected = await checkSupabaseConnection();
    console.log('✅ Connection status:', isConnected);
    
    if (!isConnected) {
      console.log('❌ Supabase connection failed');
      return;
    }
    
    // Check if required tables exist
    const requiredTables = [
      'customers',
      'contacts', 
      'communications',
      'processes',
      'teams',
      'services',
      'documents',
      'timeline_events',
      'chat_sessions',
      'chat_messages',
      'users'
    ];
    
    console.log('\n🔍 Checking required tables...');
    
    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ Table '${tableName}': ${error.message}`);
        } else {
          console.log(`✅ Table '${tableName}': exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${tableName}': ${err.message}`);
      }
    }
    
    console.log('\n🔍 Testing basic CRUD operations...');
    
    // Test customers table
    try {
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .limit(5);
        
      if (customersError) {
        console.log('❌ Customers query failed:', customersError.message);
      } else {
        console.log(`✅ Customers table: ${customers?.length || 0} records found`);
      }
    } catch (err) {
      console.log('❌ Customers query error:', err.message);
    }
    
    // Test contacts table
    try {
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .limit(5);
        
      if (contactsError) {
        console.log('❌ Contacts query failed:', contactsError.message);
      } else {
        console.log(`✅ Contacts table: ${contacts?.length || 0} records found`);
      }
    } catch (err) {
      console.log('❌ Contacts query error:', err.message);
    }
    
    // Test communications table
    try {
      const { data: communications, error: communicationsError } = await supabase
        .from('communications')
        .select('*')
        .limit(5);
        
      if (communicationsError) {
        console.log('❌ Communications query failed:', communicationsError.message);
      } else {
        console.log(`✅ Communications table: ${communications?.length || 0} records found`);
      }
    } catch (err) {
      console.log('❌ Communications query error:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

// Run the test
testSupabaseConnection()
  .then(() => {
    console.log('\n🎉 Connection test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
