/**
 * Test authentication API
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  try {
    console.log('🔍 Testing login API...');
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'AdminPass123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User:', data.data.user);
      console.log('Token:', data.data.accessToken ? 'Present' : 'Missing');
      
      // Test authenticated endpoint
      console.log('\n🔍 Testing authenticated endpoint...');
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.data.accessToken}`
        }
      });
      
      const meData = await meResponse.json();
      
      if (meResponse.ok) {
        console.log('✅ Authenticated request successful!');
        console.log('User data:', meData.data.user);
      } else {
        console.error('❌ Authenticated request failed:', meData);
      }
      
    } else {
      console.error('❌ Login failed:', data);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testLogin();