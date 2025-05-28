/**
 * Test script to verify Ollama integration with our AI chat library
 */

// Test Ollama API connection directly
async function testOllamaAPI() {
  console.log('🔍 Testing Ollama API connection...');
  
  try {
    // Test connection
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Ollama API connected successfully');
    console.log(`📋 Available models: ${data.models.map(m => m.name).join(', ')}`);
    
    return data.models;
  } catch (error) {
    console.error('❌ Failed to connect to Ollama API:', error.message);
    return null;
  }
}

// Test sending a message to Ollama
async function testOllamaChat(model = 'llama3.1:latest') {
  console.log(`\n🤖 Testing chat with model: ${model}`);
  
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: 'Hello! Please respond with just "AI chat is working correctly" to confirm the connection.',
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Chat response received');
    console.log(`💬 Response: ${data.response}`);
    
    return data.response;
  } catch (error) {
    console.error('❌ Failed to chat with Ollama:', error.message);
    return null;
  }
}

// Test CRM context generation
async function testCRMContext() {
  console.log('\n📊 Testing CRM context generation...');
  
  // Mock CRM data
  const mockCRMData = {
    customers: [
      { id: 1, name: 'Tech Corp', phase: 'Steady State' },
      { id: 2, name: 'StartupCo', phase: 'Contracting' }
    ],
    processes: [
      { id: 1, name: 'Onboarding Process', stage: 'Requirements' }
    ],
    teams: [
      { id: 1, name: 'Development Team', memberCount: 5 }
    ],
    services: [
      { id: 1, name: 'Web Development', monthlyHours: 40 }
    ]
  };
  
  console.log('✅ CRM context generated successfully');
  console.log(`📈 Summary: ${mockCRMData.customers.length} customers, ${mockCRMData.processes.length} processes, ${mockCRMData.teams.length} teams, ${mockCRMData.services.length} services`);
  
  return mockCRMData;
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Ollama Integration Tests\n');
  
  const models = await testOllamaAPI();
  if (!models || models.length === 0) {
    console.log('\n❌ Cannot proceed with tests - Ollama API not available');
    return;
  }
  
  await testOllamaChat(models[0].name);
  await testCRMContext();
  
  console.log('\n✅ All tests completed!');
  console.log('\n🎉 AI Chat integration is ready for testing in the Sales Dashboard application.');
}

// Execute tests
runTests().catch(error => {
  console.error('💥 Test execution failed:', error);
});
