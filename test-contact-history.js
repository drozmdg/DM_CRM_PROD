/**
 * Test script for ContactHistory communication functionality
 * This script tests the communication API endpoints and ContactHistory component integration
 */

// Test data for communications
const testCommunication = {
  contactId: 1, // Using numeric ID to match mock storage
  type: 'email',
  subject: 'Project Status Update',
  notes: 'Discussed the current progress of the data migration project.',
  date: '2025-05-27'
};

// Base URL for API
const baseUrl = 'http://localhost:5000/api';

console.log('🧪 Testing ContactHistory Communication API...\n');

// Test 1: Create a new communication
async function testCreateCommunication() {
  try {
    console.log('📝 Test 1: Creating new communication...');
    const response = await fetch(`${baseUrl}/communications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCommunication)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Communication created successfully:', result);
      return result.id;
    } else {
      const error = await response.text();
      console.log('❌ Failed to create communication:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating communication:', error);
    return null;
  }
}

// Test 2: Fetch communications for a contact
async function testGetCommunications(contactId) {
  try {
    console.log(`\n📋 Test 2: Fetching communications for contact ${contactId}...`);
    const response = await fetch(`${baseUrl}/communications?contactId=${contactId}`);
    
    if (response.ok) {
      const communications = await response.json();
      console.log('✅ Communications fetched successfully:', communications);
      return communications;
    } else {
      const error = await response.text();
      console.log('❌ Failed to fetch communications:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching communications:', error);
    return null;
  }
}

// Test 3: Update a communication
async function testUpdateCommunication(communicationId) {
  try {
    console.log(`\n✏️ Test 3: Updating communication ${communicationId}...`);
    const updatedData = {
      subject: 'Updated: Project Status Update',
      notes: 'Updated notes: Discussed the current progress and next steps.',
    };
    
    const response = await fetch(`${baseUrl}/communications/${communicationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Communication updated successfully:', result);
      return result;
    } else {
      const error = await response.text();
      console.log('❌ Failed to update communication:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error updating communication:', error);
    return null;
  }
}

// Test 4: Delete a communication
async function testDeleteCommunication(communicationId) {
  try {
    console.log(`\n🗑️ Test 4: Deleting communication ${communicationId}...`);
    const response = await fetch(`${baseUrl}/communications/${communicationId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      console.log('✅ Communication deleted successfully');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Failed to delete communication:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting communication:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting ContactHistory Communication API Tests...\n');
  
  // Test creating a communication
  const communicationId = await testCreateCommunication();
  
  if (communicationId) {
    // Test fetching communications
    await testGetCommunications(testCommunication.contactId);
    
    // Test updating the communication
    await testUpdateCommunication(communicationId);
    
    // Test deleting the communication
    await testDeleteCommunication(communicationId);
  }
  
  console.log('\n🏁 Tests completed!');
}

// Import fetch for Node.js ES modules
import fetch from 'node-fetch';

// Only run if this file is executed directly in Node.js
if (typeof window === 'undefined') {
  runTests();
}

// Export for browser testing
if (typeof window !== 'undefined') {
  window.testContactHistoryCommunications = runTests;
}
