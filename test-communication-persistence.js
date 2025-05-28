#!/usr/bin/env node

// Enhanced communication persistence test
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function test() {
  console.log('🧪 Testing Communication Persistence...');
  
  try {
    // Test 1: Create first communication
    console.log('📝 Test 1: Creating first communication...');
    const comm1Response = await fetch(`${API_BASE}/communications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: 1,
        type: 'email',
        subject: 'First Communication',
        notes: 'This is the first communication.',
        date: '2025-05-27'
      })
    });
    
    if (!comm1Response.ok) {
      throw new Error(`Failed to create first communication: ${comm1Response.status}`);
    }
    
    const comm1 = await comm1Response.json();
    console.log('✅ First communication created:', comm1.id);
    
    // Test 2: Create second communication
    console.log('📝 Test 2: Creating second communication...');
    const comm2Response = await fetch(`${API_BASE}/communications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: 1,
        type: 'phone',
        subject: 'Second Communication',
        notes: 'This is the second communication.',
        date: '2025-05-27'
      })
    });
    
    if (!comm2Response.ok) {
      throw new Error(`Failed to create second communication: ${comm2Response.status}`);
    }
    
    const comm2 = await comm2Response.json();
    console.log('✅ Second communication created:', comm2.id);
    
    // Test 3: Fetch all communications immediately after creation
    console.log('📋 Test 3: Fetching communications immediately...');
    const fetchResponse = await fetch(`${API_BASE}/communications?contactId=1`);
    
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch communications: ${fetchResponse.status}`);
    }
    
    const communications = await fetchResponse.json();
    console.log(`✅ Found ${communications.length} communications:`, communications.map(c => c.id));
    
    if (communications.length === 0) {
      console.log('❌ No communications found - storage persistence issue detected!');
    } else {
      console.log('✅ Communications persisted correctly!');
    }
    
    // Test 4: Wait 2 seconds and fetch again to test cross-request persistence
    console.log('⏳ Test 4: Waiting 2 seconds and fetching again...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const fetchResponse2 = await fetch(`${API_BASE}/communications?contactId=1`);
    const communications2 = await fetchResponse2.json();
    console.log(`📋 Found ${communications2.length} communications after delay:`, communications2.map(c => c.id));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();
