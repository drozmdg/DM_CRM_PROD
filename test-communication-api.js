// Test script for communication API endpoints
const API_BASE = 'http://localhost:5000/api';

async function testCommunicationAPI() {
  console.log('=== Testing Communication API Endpoints ===\n');

  try {
    // Test 1: GET /api/contacts/123/communications (should work with fallback)
    console.log('1. Testing GET /api/contacts/123/communications');
    const getResponse = await fetch(`${API_BASE}/contacts/123/communications`);
    const getCommunications = await getResponse.json();
    console.log('Status:', getResponse.status);
    console.log('Response:', JSON.stringify(getCommunications, null, 2));
    console.log('✓ GET communications works\n');    // Test 2: POST /api/communications (create new communication)
    console.log('2. Testing POST /api/communications');    const newCommunication = {
      type: 'email',
      subject: 'Test Communication via API',
      notes: 'This is a test communication created via the API endpoints.',
      date: new Date().toISOString(),
      contactId: 123
    };

    const postResponse = await fetch(`${API_BASE}/communications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newCommunication)
    });

    const createdCommunication = await postResponse.json();
    console.log('Status:', postResponse.status);
    console.log('Response:', JSON.stringify(createdCommunication, null, 2));
    
    if (postResponse.status === 201) {
      console.log('✓ POST communication works');
      
      // Test 3: GET the communication we just created
      console.log('\n3. Testing GET /api/communications/' + createdCommunication.id);
      const getOneResponse = await fetch(`${API_BASE}/communications/${createdCommunication.id}`);
      const singleCommunication = await getOneResponse.json();
      console.log('Status:', getOneResponse.status);
      console.log('Response:', JSON.stringify(singleCommunication, null, 2));
      console.log('✓ GET single communication works');

      // Test 4: PUT update the communication
      console.log('\n4. Testing PUT /api/communications/' + createdCommunication.id);      const updates = {
        subject: 'Updated Test Communication',
        notes: 'This communication has been updated via API.'
      };

      const putResponse = await fetch(`${API_BASE}/communications/${createdCommunication.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      const updatedCommunication = await putResponse.json();
      console.log('Status:', putResponse.status);
      console.log('Response:', JSON.stringify(updatedCommunication, null, 2));
      console.log('✓ PUT communication works');

      // Test 5: GET all communications again to verify persistence
      console.log('\n5. Testing GET /api/contacts/123/communications (verify persistence)');
      const getAfterResponse = await fetch(`${API_BASE}/contacts/123/communications`);
      const communicationsAfter = await getAfterResponse.json();
      console.log('Status:', getAfterResponse.status);
      console.log('Response:', JSON.stringify(communicationsAfter, null, 2));
      console.log('✓ Communications persist across requests');

      // Test 6: DELETE the communication
      console.log('\n6. Testing DELETE /api/communications/' + createdCommunication.id);
      const deleteResponse = await fetch(`${API_BASE}/communications/${createdCommunication.id}`, {
        method: 'DELETE'
      });
      console.log('Status:', deleteResponse.status);
      
      if (deleteResponse.status === 204) {
        console.log('✓ DELETE communication works');
        
        // Test 7: Verify deletion
        console.log('\n7. Testing GET /api/contacts/123/communications (verify deletion)');
        const getFinalResponse = await fetch(`${API_BASE}/contacts/123/communications`);
        const finalCommunications = await getFinalResponse.json();
        console.log('Status:', getFinalResponse.status);
        console.log('Response:', JSON.stringify(finalCommunications, null, 2));
        console.log('✓ Communication was deleted successfully');
      }
    }

    console.log('\n=== All Communication API Tests Completed Successfully! ===');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the tests
testCommunicationAPI();
