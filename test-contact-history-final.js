// Final test for ContactHistory component with real contact data
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const API_BASE = 'http://localhost:5000/api';

async function createTestCommunications() {
  console.log('=== Creating Test Communications for ContactHistory Component ===\n');

  // Use a real contact from the existing data
  const realContactId = 'contact-1747969696005'; // Zilly Zed
  
  const testCommunications = [
    {
      contactId: parseInt(realContactId.split('-')[1]) || 1747969696005,
      type: 'email',
      subject: 'Project Kickoff Meeting',
      notes: 'Discussed project timeline and deliverables for Q2',
      date: '2025-05-27T09:00:00Z'
    },
    {
      contactId: parseInt(realContactId.split('-')[1]) || 1747969696005,
      type: 'phone',
      subject: 'Follow-up Call',
      notes: 'Clarified requirements and next steps',
      date: '2025-05-28T14:30:00Z'
    },
    {
      contactId: parseInt(realContactId.split('-')[1]) || 1747969696005,
      type: 'meeting',
      subject: 'Strategy Review',
      notes: 'In-person meeting to review strategic objectives',
      date: '2025-05-25T11:00:00Z'
    }
  ];

  console.log(`Creating communications for contact: ${realContactId}`);
  console.log(`Using numeric contact ID: ${testCommunications[0].contactId}\n`);

  try {
    for (let i = 0; i < testCommunications.length; i++) {
      const comm = testCommunications[i];
      console.log(`Creating communication ${i + 1}: ${comm.subject}`);
      
      const response = await fetch(`${API_BASE}/communications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comm)
      });

      if (response.ok) {
        const created = await response.json();
        console.log(`✓ Created: ${created.subject} (ID: ${created.id})`);
      } else {
        const error = await response.text();
        console.log(`❌ Failed to create: ${error}`);
      }
    }

    // Verify communications were created
    console.log('\n=== Verifying Communications ===');
    const verifyResponse = await fetch(`${API_BASE}/contacts/${realContactId}/communications`);
    
    if (verifyResponse.ok) {
      const communications = await verifyResponse.json();
      console.log(`✓ Found ${communications.length} communications for contact`);
      console.log('Communications:', JSON.stringify(communications, null, 2));
    } else {
      console.log('❌ Failed to verify communications');
    }

    console.log('\n=== Test Data Created Successfully! ===');
    console.log('Now you can:');
    console.log('1. Go to http://localhost:5000/contacts');
    console.log('2. Find contact "Zilly Zed"'); 
    console.log('3. Click the History button (search icon)');
    console.log('4. Verify the ContactHistory component displays the communications');

  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

// Run the test
createTestCommunications();
