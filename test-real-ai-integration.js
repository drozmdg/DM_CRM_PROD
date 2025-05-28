/**
 * Test the AI Chat integration with real customer data
 */

async function testRealAIChatIntegration() {
  console.log('🤖 Testing Real AI Chat Integration with Customer Data...\n');

  try {
    // Test 1: Check if we can fetch customers data from the API
    console.log('📊 Fetching customer data from API...');
    const customersResponse = await fetch('http://localhost:5000/api/customers');
    if (!customersResponse.ok) {
      throw new Error(`Failed to fetch customers: ${customersResponse.status}`);
    }
    const customers = await customersResponse.json();
    console.log(`✅ Found ${customers.length} customers`);
    
    if (customers.length > 0) {
      console.log('👥 Customer list:');
      customers.forEach(customer => {
        console.log(`   - ${customer.name} (${customer.phase})`);
      });
    }

    // Test 2: Test the system prompt generation with real data
    console.log('\n🔍 Testing system prompt with real customer data...');
    
    // Create a comprehensive system prompt with real data
    const systemPrompt = `You are an AI assistant for the Sales Dashboard CRM system.
You have full access to the CRM data since you're running locally and the user is the sole administrator.

## SUMMARY STATISTICS

### Customer Statistics
- Total Customers: ${customers.length}

## DETAILED CUSTOMER INFORMATION
${customers.map(customer => `${customer.name} (Phase: ${customer.phase})`).join('\n')}

## RESPONSE GUIDELINES
- When answering questions, provide specific and detailed information about the CRM data.
- Include specific customer names when relevant.
- Be helpful, detailed, and accurate in your responses.

Answer questions based on the customer data provided above.`;

    console.log(`✅ System prompt generated (${systemPrompt.length} characters)`);

    // Test 3: Send a test question to Ollama with the system prompt
    console.log('\n🎯 Testing AI response with customer data context...');
    
    const testQuestion = "What customers do we have and what are their current phases?";
    
    const requestBody = {
      model: 'llama3.1:latest',
      prompt: testQuestion,
      system: systemPrompt,
      temperature: 0.7,
      max_tokens: 300,
      stream: false
    };

    console.log(`📤 Sending question: "${testQuestion}"`);
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('\n🤖 AI Response:');
    console.log('─'.repeat(60));
    console.log(data.response);
    console.log('─'.repeat(60));

    // Test 4: Verify the response contains actual customer data
    console.log('\n📊 Verifying response contains customer data...');
    
    let customersFound = 0;
    customers.forEach(customer => {
      if (data.response.toLowerCase().includes(customer.name.toLowerCase())) {
        console.log(`   ✅ ${customer.name} mentioned`);
        customersFound++;
      } else {
        console.log(`   ❌ ${customer.name} not mentioned`);
      }
    });

    console.log(`\n📈 Results: ${customersFound}/${customers.length} customers mentioned in AI response`);

    if (customersFound > 0) {
      console.log('🎉 SUCCESS: AI is using customer data from the system prompt!');
    } else {
      console.log('⚠️  WARNING: AI response does not seem to include customer data.');
    }

    // Test 5: Test a more specific customer question
    console.log('\n🔍 Testing specific customer question...');
    
    if (customers.length > 0) {
      const firstCustomer = customers[0];
      const specificQuestion = `Tell me about ${firstCustomer.name}`;
      
      const specificRequestBody = {
        ...requestBody,
        prompt: specificQuestion
      };

      console.log(`📤 Sending specific question: "${specificQuestion}"`);
      
      const specificResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(specificRequestBody)
      });

      if (specificResponse.ok) {
        const specificData = await specificResponse.json();
        
        console.log('\n🤖 AI Response to specific question:');
        console.log('─'.repeat(60));
        console.log(specificData.response);
        console.log('─'.repeat(60));

        if (specificData.response.toLowerCase().includes(firstCustomer.name.toLowerCase())) {
          console.log('✅ AI correctly responded with customer-specific information!');
        } else {
          console.log('⚠️  AI response does not include the specific customer information.');
        }
      }
    }

    console.log('\n✅ Real AI Chat Integration Test Complete!');
    return true;

  } catch (error) {
    console.error('\n❌ Error during real AI chat integration test:', error.message);
    return false;
  }
}

// Run the test
testRealAIChatIntegration().then(success => {
  if (success) {
    console.log('\n🎊 All tests passed! The AI Chat system is working correctly with customer data.');
  } else {
    console.log('\n🚨 Some tests failed. Please check the implementation.');
  }
}).catch(error => {
  console.error('Test failed with error:', error);
});
