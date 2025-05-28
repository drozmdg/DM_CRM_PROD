/**
 * AI Chat functionality for RETRO_CRM
 *
 * This file contains the core AI chat functionality, including message processing
 * and integration with Ollama for AI responses.
 *
 * NOTE: This file is deprecated and has been refactored into the src/lib/ai-chat directory.
 * It is kept for backward compatibility and will be removed in a future update.
 */

// Re-export everything from the ai-chat module
export * from './ai-chat';





/**
 * Process a message using the Ollama API
 * @param message The user's message
 * @returns Promise that resolves to the AI's response
 */
export const processMessage = async (message: string): Promise<string> => {
  try {
    // Prepare the request body
    const requestBody: any = {
      model: ollamaConfig.model,
      prompt: message,
      temperature: ollamaConfig.temperature,
      max_tokens: ollamaConfig.maxTokens,
      stream: false,
    };

    // Add system prompt if enabled
    if (ollamaConfig.useSystemPrompt) {
      requestBody.system = generateSystemPrompt();
    }

    const response = await fetch(ollamaConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorObj;
      try {
        errorObj = JSON.parse(errorText);
      } catch (e) {
        errorObj = { error: errorText };
      }

      console.error('Ollama API error:', errorObj);

      // Check if it's a model not found error
      if (errorObj.error && errorObj.error.includes('model') && errorObj.error.includes('not found')) {
        throw new Error(`Model '${ollamaConfig.model}' not found. Please make sure you have pulled this model using 'ollama pull ${ollamaConfig.model}' or select a different model in the AI Config.`);
      }

      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || 'I apologize, but I couldn\'t generate a response.';
  } catch (error) {
    console.error('Error calling Ollama API:', error);

    // If it's a model not found error, provide a specific response
    if (error instanceof Error && error.message.includes('Model') && error.message.includes('not found')) {
      return `${error.message}\n\nI'm currently using fallback responses until this is resolved.`;
    }

    // Check if it's a connection error (likely Ollama not running)
    if (error instanceof Error && (
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('ECONNREFUSED')
    )) {
      return "I couldn't connect to the Ollama server. Please make sure Ollama is running on your machine. You can start it by running 'ollama serve' in your terminal. I'll use fallback responses in the meantime.";
    }

    // Fallback to mock responses if Ollama is not available
    return getFallbackResponse(message);
  }
};

// Mock AI responses for fallback when Ollama is not available
const mockAIResponses = [
  "I'm analyzing your customer data now...",
  "Based on your process metrics, I recommend focusing on improving the development phase.",
  "Your customer satisfaction metrics are trending upward this quarter.",
  "I've identified 3 processes that are behind schedule. Would you like more details?",
  "The team with the highest efficiency this month is the Alpha team.",
  "I can help you generate a report on customer contract renewals if you need it.",
  "Your CRM data shows that you have 5 customers in the 'New Activation' phase.",
  "Would you like me to analyze your process timelines for potential bottlenecks?",
  "I notice you have several pending approvals. Would you like me to summarize them?",
  "Based on historical data, your current project is likely to complete on time."
];

/**
 * Get a fallback response when Ollama is not available
 * @param message The user's message
 * @returns A fallback response
 */
export const getFallbackResponse = (message: string): string => {
  // First check for keyword-based responses
  const keywordResponse = getKeywordResponse(message);
  if (keywordResponse) {
    return keywordResponse;
  }

  // Otherwise, return a random response
  const randomIndex = Math.floor(Math.random() * mockAIResponses.length);
  return mockAIResponses[randomIndex];
};

/**
 * Generate an initial greeting message from the AI
 * @returns A greeting message
 */
export const getInitialGreeting = (): string => {
  return "Hello! I'm your RETRO_CRM assistant powered by Ollama. How can I help you today?";
};

/**
 * Generate a message when chat history is cleared
 * @returns A message acknowledging the cleared history
 */
export const getClearHistoryMessage = (): string => {
  return "Chat history cleared. How can I help you today?";
};

/**
 * Check if the user's message contains certain keywords and provide a more specific response
 * This is a rule-based approach that provides targeted responses for common queries
 *
 * @param message The user's message
 * @returns A specific response if keywords are found, null otherwise
 */
export const getKeywordResponse = (message: string): string | null => {
  const lowerMessage = message.toLowerCase();

  // Check if we have CRM data
  if (!crmData || !crmData.customers) {
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return "I can help you with information about your customers, processes, teams, and contracts once you have data in your CRM system.";
    }
    return null;
  }

  // Get suggested queries
  if (lowerMessage.includes('suggest') && (lowerMessage.includes('question') || lowerMessage.includes('query'))) {
    return `
## Suggested Queries

Here are some questions you can ask me:

### Customer Information
- Show me a summary of all customers
- Which customers are in the Implementation phase?
- When is the next contract renewal?
- Which customer has the most processes?

### Process Analysis
- How many processes are in the Development stage?
- Show me all processes pending approval
- Which functional area has the most processes?
- What's the status of processes for [customer name]?

### Team & Service Insights
- Which teams support the most customers?
- What services are we providing to [customer name]?
- How many customers use the Data Ingestion service?
- Which team is assigned to the most processes?

### General Analysis
- What are the key metrics for this month?
- Show me customers at risk (contract ending soon)
- What's the distribution of processes by SDLC stage?
- Give me a summary of the CRM data
`;
  }

  // Customer count
  if (lowerMessage.includes('customer') && lowerMessage.includes('count')) {
    const count = crmData.customers.length;
    return `You currently have ${count} customer${count !== 1 ? 's' : ''} in the system.`;
  }

  // Process status
  if (lowerMessage.includes('process') && lowerMessage.includes('status')) {
    const statusCounts: Record<string, number> = {};
    let totalProcesses = 0;

    crmData.customers.forEach((customer: any) => {
      if (customer.processes) {
        totalProcesses += customer.processes.length;
        customer.processes.forEach((process: any) => {
          const status = process.status || 'Unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
      }
    });

    if (totalProcesses === 0) {
      return "There are no processes in the system yet.";
    }

    const statusText = Object.entries(statusCounts)
      .map(([status, count]) => `${count} ${status}`)
      .join(', ');

    return `There are ${totalProcesses} total processes: ${statusText}.`;
  }

  // List customers
  if ((lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('all')) &&
      lowerMessage.includes('customer')) {
    const customerNames = crmData.customers.map((c: any) => c.name).join(', ');
    return `Here are all your customers: ${customerNames}`;
  }

  // Customer details
  const customerNameMatch = lowerMessage.match(/(?:about|details|info|information about|tell me about)\s+([a-z0-9\s]+)(?:customer)?/i);
  if (customerNameMatch) {
    const customerName = customerNameMatch[1].trim();
    const customer = findCustomerByName(customerName);

    if (customer) {
      const teams = customer.teams ? customer.teams.map((t: any) => t.name).join(', ') : 'None';
      const services = customer.services ? customer.services.map((s: any) => s.name).join(', ') : 'None';
      const processes = customer.processes ? customer.processes.length : 0;

      return `
Customer: ${customer.name}
Phase: ${customer.phase || 'N/A'}
Contract Start: ${customer.contractStart || 'N/A'}
Contract End: ${customer.contractEnd || 'N/A'}
Teams: ${teams}
Services: ${services}
Processes: ${processes}
      `.trim();
    }
  }

  // Help message
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return `I can help you with detailed information about your CRM data. You can ask me things like:
- How many customers do we have?
- What's the status of our processes?
- List all customers
- Tell me about [customer name]
- What teams are assigned to [customer name]?
- What services does [customer name] have?
- Show me processes for [customer name]

Since you're the sole administrator and using a local LLM, I have full access to your CRM data and can provide specific details.`;
  }

  // Ollama model info
  if (lowerMessage.includes('ollama') || lowerMessage.includes('model')) {
    return `I'm currently using the ${ollamaConfig.model} model via Ollama. You can change the model by updating the configuration in the left panel.`;
  }

  // No specific keyword match found
  return null;
};

/**
 * Main function to handle a user message and generate a response
 *
 * @param message The user's message
 * @returns Promise that resolves to the AI's response
 */
export const handleUserMessage = async (message: string): Promise<string> => {
  // First check for keyword-based responses
  const keywordResponse = getKeywordResponse(message);

  if (keywordResponse) {
    // If we have a specific response for this message, use it
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(keywordResponse);
      }, 500);
    });
  }

  // Otherwise, use Ollama to generate a response
  return processMessage(message);
};
