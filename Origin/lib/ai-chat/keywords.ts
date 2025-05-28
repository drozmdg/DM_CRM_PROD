/**
 * AI Chat Keywords
 * 
 * This file contains functions for keyword-based responses.
 */

import { getCRMData, findCustomerByName } from './context';

/**
 * Check if the user's message contains certain keywords and provide a more specific response
 * This is a rule-based approach that provides targeted responses for common queries
 *
 * @param message The user's message
 * @returns A specific response if keywords are found, null otherwise
 */
export const getKeywordResponse = (message: string): string | null => {
  const lowerMessage = message.toLowerCase();
  const crmData = getCRMData();

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
    // Import here to avoid circular dependency
    const { getOllamaConfig } = require('./config');
    const config = getOllamaConfig();
    return `I'm currently using the ${config.model} model via Ollama. You can change the model by updating the configuration in the left panel.`;
  }

  // No specific keyword match found
  return null;
};
