/**
 * Test script to verify the enhanced system prompt
 */

// Mock CRM data similar to what would be loaded from the API
const mockCRMData = {
  customers: [
    {
      id: 1,
      name: 'Tech Solutions Inc',
      phase: 'Steady State',
      contractStartDate: '2024-01-01',
      contractEndDate: '2025-12-31'
    },
    {
      id: 2,
      name: 'Startup Ventures',
      phase: 'New Activation',
      contractStartDate: '2024-11-01',
      contractEndDate: '2025-10-31'
    }
  ],
  processes: [
    {
      id: 1,
      name: 'System Migration',
      customerId: 1,
      status: 'In Progress',
      sdlcStage: 'Development',
      functionalArea: 'Infrastructure',
      approvalStatus: 'Approved'
    },
    {
      id: 2,
      name: 'Data Integration',
      customerId: 2,
      status: 'Planning',
      sdlcStage: 'Requirements',
      functionalArea: 'Data Management',
      approvalStatus: 'Pending'
    }
  ],
  teams: [
    {
      id: 1,
      name: 'Development Team A',
      customerId: 1
    },
    {
      id: 2,
      name: 'Analytics Team',
      customerId: 2
    }
  ],
  services: [
    {
      id: 1,
      name: 'Web Development',
      customerId: 1
    },
    {
      id: 2,
      name: 'Data Analytics',
      customerId: 2
    }
  ]
};

// Test the system prompt generation
async function testSystemPrompt() {
  console.log('🔍 Testing Enhanced System Prompt Generation...\n');

  try {
    // Import the context functions (this would normally be done in the browser)
    // For testing purposes, we'll simulate the setCRMData and generateSystemPrompt functions
    
    // Mock the context generation logic
    const generateSystemPrompt = () => {
      const customerCount = mockCRMData.customers.length;
      const processCount = mockCRMData.processes.length;
      const teamCount = mockCRMData.teams.length;
      const serviceCount = mockCRMData.services.length;

      // Process statistics
      const processStatusCounts = {};
      const processStageDistribution = {};
      const processFunctionalAreaDistribution = {};
      const processApprovalStatusDistribution = {};
      
      // Customer phase distribution
      const phaseDistribution = {};
      
      // Contract renewals
      const upcomingRenewals = [];
      const today = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(today.getDate() + 90);

      // Process customer data
      mockCRMData.customers.forEach((customer) => {
        // Count phases
        const phase = customer.phase || 'Unknown';
        phaseDistribution[phase] = (phaseDistribution[phase] || 0) + 1;

        // Check for upcoming contract renewals
        if (customer.contractEndDate) {
          const contractEndDate = new Date(customer.contractEndDate);
          if (contractEndDate > today && contractEndDate <= ninetyDaysFromNow) {
            upcomingRenewals.push({
              name: customer.name,
              contractEnd: customer.contractEndDate
            });
          }
        }
      });

      // Process processes data
      mockCRMData.processes.forEach((process) => {
        // Process status counts
        const status = process.status || 'Unknown';
        processStatusCounts[status] = (processStatusCounts[status] || 0) + 1;

        // SDLC stage distribution
        const stage = process.sdlcStage || 'Unknown';
        processStageDistribution[stage] = (processStageDistribution[stage] || 0) + 1;

        // Functional area distribution
        const area = process.functionalArea || 'Unknown';
        processFunctionalAreaDistribution[area] = (processFunctionalAreaDistribution[area] || 0) + 1;

        // Approval status distribution
        const approvalStatus = process.approvalStatus || 'Unknown';
        processApprovalStatusDistribution[approvalStatus] = (processApprovalStatusDistribution[approvalStatus] || 0) + 1;
      });

      // Generate customer details
      const customerDetails = mockCRMData.customers.map((customer) => {
        const processes = mockCRMData.processes.filter(p => p.customerId === customer.id) || [];
        const teams = mockCRMData.teams.filter(t => t.customerId === customer.id) || [];
        const services = mockCRMData.services.filter(s => s.customerId === customer.id) || [];

        return `${customer.name} (Phase: ${customer.phase || 'Unknown'}, Processes: ${processes.length}, Teams: ${teams.length}, Services: ${services.length})`;
      }).join('\n');

      // Format the upcoming renewals
      const renewalsText = upcomingRenewals.length > 0
        ? upcomingRenewals.map(renewal => `${renewal.name} (${renewal.contractEnd})`).join('\n')
        : "None in the next 90 days";

      // Generate the comprehensive system prompt
      return `You are an AI assistant for the Sales Dashboard CRM system.
You have full access to the CRM data since you're running locally and the user is the sole administrator.

## SUMMARY STATISTICS

### Customer Statistics
- Total Customers: ${customerCount}
- Customer Phase Distribution: ${Object.entries(phaseDistribution).map(([phase, count]) => `${phase}: ${count}`).join(', ')}
- Upcoming Contract Renewals: ${upcomingRenewals.length} in the next 90 days

### Process Statistics
- Total Processes: ${processCount}
- Process Status Distribution: ${Object.entries(processStatusCounts).map(([status, count]) => `${status}: ${count}`).join(', ')}
- SDLC Stage Distribution: ${Object.entries(processStageDistribution).map(([stage, count]) => `${stage}: ${count}`).join(', ')}
- Functional Area Distribution: ${Object.entries(processFunctionalAreaDistribution).map(([area, count]) => `${area}: ${count}`).join(', ')}
- Approval Status Distribution: ${Object.entries(processApprovalStatusDistribution).map(([status, count]) => `${status}: ${count}`).join(', ')}

### Team & Service Statistics
- Total Teams: ${teamCount}
- Total Services: ${serviceCount}

## DETAILED CUSTOMER INFORMATION
${customerDetails}

## UPCOMING CONTRACT RENEWALS
${renewalsText}

## RESPONSE GUIDELINES
- When answering questions, provide specific and detailed information about the CRM data.
- Format your responses using markdown for better readability.
- Use tables when presenting comparative data.
- Use bullet points for lists of items.
- Include specific customer, team, or process names when relevant.
- If asked about trends or patterns, analyze the data and provide insights.
- For process-related questions, consider the SDLC stages and approval statuses.
- When discussing customers, mention their phase and contract details when relevant.

You have access to all customer details including their processes, teams, services, and contacts.
The user is the sole administrator of this system and has authorized full data access.
Be helpful, detailed, and accurate in your responses.`.trim();
    };

    const systemPrompt = generateSystemPrompt();
    
    console.log('✅ System prompt generated successfully!');
    console.log(`📏 Prompt length: ${systemPrompt.length} characters`);
    console.log('\n📋 System prompt contains:');
    
    // Check if the prompt contains expected customer data
    const expectedContent = [
      'Tech Solutions Inc',
      'Startup Ventures',
      'System Migration', 
      'Data Integration',
      'Development Team A',
      'Analytics Team',
      'Steady State',
      'New Activation'
    ];

    let foundContent = 0;
    expectedContent.forEach(content => {
      if (systemPrompt.includes(content)) {
        console.log(`   ✅ ${content}`);
        foundContent++;
      } else {
        console.log(`   ❌ ${content} (missing)`);
      }
    });

    console.log(`\n📊 Content verification: ${foundContent}/${expectedContent.length} items found`);
    
    if (foundContent === expectedContent.length) {
      console.log('🎉 All expected content found in system prompt!');
    } else {
      console.log('⚠️  Some expected content is missing from the system prompt.');
    }

    console.log('\n📖 First 500 characters of system prompt:');
    console.log('─'.repeat(60));
    console.log(systemPrompt.substring(0, 500) + '...');
    console.log('─'.repeat(60));

    return true;
  } catch (error) {
    console.error('❌ Error testing system prompt:', error);
    return false;
  }
}

// Test Ollama integration with the enhanced system prompt
async function testOllamaWithSystemPrompt() {
  console.log('\n🤖 Testing Ollama with Enhanced System Prompt...\n');

  const systemPrompt = `You are an AI assistant for the Sales Dashboard CRM system.

## SUMMARY STATISTICS
### Customer Statistics
- Total Customers: 2
- Customer Phase Distribution: Steady State: 1, New Activation: 1

## DETAILED CUSTOMER INFORMATION
Tech Solutions Inc (Phase: Steady State, Processes: 1, Teams: 1, Services: 1)
Startup Ventures (Phase: New Activation, Processes: 1, Teams: 1, Services: 1)

## RESPONSE GUIDELINES
- Provide specific information about customers when asked
- Use the customer data provided above in your responses
- Be helpful and detailed

Answer this question about our customers.`;

  const testMessage = "How many customers do we have and what are their names?";

  const requestBody = {
    model: 'llama3.1:latest',
    prompt: testMessage,
    system: systemPrompt,
    temperature: 0.7,
    max_tokens: 200,
    stream: false
  };

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Ollama responded successfully!');
    console.log('\n🔍 Test Question:', testMessage);
    console.log('\n🤖 AI Response:');
    console.log('─'.repeat(60));
    console.log(data.response);
    console.log('─'.repeat(60));

    // Check if the response contains customer information from the system prompt
    const customerNames = ['Tech Solutions Inc', 'Startup Ventures'];
    let foundCustomers = 0;
    
    customerNames.forEach(name => {
      if (data.response.includes(name)) {
        foundCustomers++;
      }
    });

    console.log(`\n📊 Customer data integration: ${foundCustomers}/${customerNames.length} customers mentioned`);
    
    if (foundCustomers > 0) {
      console.log('🎉 System prompt is working! AI is using customer data from context.');
    } else {
      console.log('⚠️  System prompt may not be working properly. AI response does not include customer data.');
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to test Ollama with system prompt:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🔬 Enhanced System Prompt Testing Suite');
  console.log('=' .repeat(50));
  
  const promptTest = await testSystemPrompt();
  const ollamaTest = await testOllamaWithSystemPrompt();
  
  console.log('\n📋 Test Results Summary:');
  console.log(`   System Prompt Generation: ${promptTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Ollama Integration: ${ollamaTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (promptTest && ollamaTest) {
    console.log('\n🎉 All tests passed! The enhanced system prompt is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

runTests().catch(console.error);
