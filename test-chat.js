/**
 * Test script for AI Chat functionality
 * Run this script to test creating a chat session and sending messages
 */

async function testChat() {
  try {
    console.log('📱 Testing AI Chat functionality...');
    
    // 1. Create a new chat session
    console.log('📱 Creating a new chat session...');
    const sessionResponse = await fetch('http://localhost:5000/api/chat/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Chat Session'
      })
    });
    
    if (!sessionResponse.ok) {
      throw new Error(`Failed to create session: ${sessionResponse.status} ${sessionResponse.statusText}`);
    }
    
    const session = await sessionResponse.json();
    console.log('✅ Session created:', session);
    
    // 2. Send a message
    console.log('📱 Sending a test message...');
    const messageResponse = await fetch(`http://localhost:5000/api/chat/sessions/${session.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Hello, can you help me with customer information?',
        sender: 'user'
      })
    });
    
    if (!messageResponse.ok) {
      throw new Error(`Failed to send message: ${messageResponse.status} ${messageResponse.statusText}`);
    }
    
    const message = await messageResponse.json();
    console.log('✅ Message sent:', message);
    
    // 3. Get all messages in the session
    console.log('📱 Fetching messages...');
    
    // Wait a bit for the AI to respond
    console.log('⏳ Waiting for AI response...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const messagesResponse = await fetch(`http://localhost:5000/api/chat/sessions/${session.id}/messages`);
    
    if (!messagesResponse.ok) {
      throw new Error(`Failed to fetch messages: ${messagesResponse.status} ${messagesResponse.statusText}`);
    }
    
    const messages = await messagesResponse.json();
    console.log('✅ Messages received:', messages.length);
    messages.forEach((msg, i) => {
      console.log(`Message ${i + 1} - ${msg.sender}:`, msg.content);
    });
    
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testChat();
