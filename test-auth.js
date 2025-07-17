/**
 * Authentication System Test Script
 * Tests the authentication components without full server startup
 */

// Skip the auth service for now since it's TypeScript
import { supabase } from './server/lib/supabase.ts';

async function testAuthSystem() {
  console.log('🔍 Testing Authentication System...\n');

  try {
    // Test 1: Check Supabase connection
    console.log('1. Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Test 2: Check if required tables exist
    console.log('\n2. Checking database tables...');
    const tables = ['users', 'roles', 'user_roles', 'user_sessions', 'audit_logs'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.error(`❌ Table ${table} check failed:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists`);
        }
      } catch (err) {
        console.error(`❌ Table ${table} access error:`, err.message);
      }
    }

    // Test 3: Check password hashing functions
    console.log('\n3. Testing password hashing functions...');
    try {
      const { data: hashResult } = await supabase.rpc('hash_password', { password: 'TestPass123' });
      if (hashResult) {
        console.log('✅ Password hashing function works');
        
        const { data: verifyResult } = await supabase.rpc('verify_password', { 
          password: 'TestPass123', 
          hash: hashResult 
        });
        if (verifyResult) {
          console.log('✅ Password verification function works');
        } else {
          console.error('❌ Password verification failed');
        }
      } else {
        console.error('❌ Password hashing failed');
      }
    } catch (err) {
      console.error('❌ Password functions error:', err.message);
    }

    // Test 4: Check roles data
    console.log('\n4. Checking roles data...');
    try {
      const { data: roles, error } = await supabase.from('roles').select('*');
      if (error) {
        console.error('❌ Roles query failed:', error.message);
      } else {
        console.log(`✅ Found ${roles.length} roles:`, roles.map(r => r.name).join(', '));
      }
    } catch (err) {
      console.error('❌ Roles check error:', err.message);
    }

    // Test 5: Check if we can manually create a user
    console.log('\n5. Testing manual user creation...');
    try {
      const testUserId = 'test-user-001';
      const testEmail = 'test@example.com';
      
      // Try to insert a test user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          name: 'Test User',
          email: testEmail,
          role: 'Viewer',
          is_active: true,
          email_verified: true
        });
      
      if (insertError) {
        console.error('❌ Manual user creation failed:', insertError.message);
      } else {
        console.log('✅ Manual user creation successful');
        
        // Clean up
        await supabase.from('users').delete().eq('id', testUserId);
        console.log('✅ Test user cleaned up');
      }
      
    } catch (err) {
      console.error('❌ Manual user creation test failed:', err.message);
    }

    console.log('\n🎉 Authentication system test completed!');
    console.log('\nNext steps:');
    console.log('1. Server should be ready for authentication');
    console.log('2. You can create your first admin user');
    console.log('3. Test the authentication endpoints');

  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  }
}

// Run the test
testAuthSystem().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});