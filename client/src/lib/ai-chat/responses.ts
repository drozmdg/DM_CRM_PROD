/**
 * AI Chat Responses
 * 
 * This file contains functions for generating AI responses.
 */

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
  const lowerMessage = message.toLowerCase();
  
  // Check for specific keywords and provide contextual responses
  if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
    return "I can help you analyze customer data, including contract statuses, renewal dates, and process phases. What specific customer information would you like to explore?";
  }
  
  if (lowerMessage.includes('process') || lowerMessage.includes('workflow')) {
    return "I can provide insights about your processes, including timeline analysis, bottlenecks, and efficiency metrics. Which processes would you like me to examine?";
  }
  
  if (lowerMessage.includes('team') || lowerMessage.includes('staff')) {
    return "I can analyze team performance, workload distribution, and resource allocation. What team-related insights are you looking for?";
  }
  
  if (lowerMessage.includes('service') || lowerMessage.includes('offering')) {
    return "I can help you understand service utilization, customer satisfaction, and service performance metrics. What service information do you need?";
  }
  
  if (lowerMessage.includes('report') || lowerMessage.includes('summary')) {
    return "I can generate comprehensive reports on customers, processes, teams, and services. What type of report would be most helpful for you?";
  }
  
  // Return a random response for general queries
  const randomIndex = Math.floor(Math.random() * mockAIResponses.length);
  return mockAIResponses[randomIndex];
};

/**
 * Get keyword-based response for specific queries
 * @param message The user's message
 * @returns A keyword-based response or null if no match
 */
export const getKeywordResponse = (message: string): string | null => {
  const lowerMessage = message.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm your AI assistant for the CRM system. I can help you analyze customer data, processes, team performance, and generate insights. What would you like to explore today?";
  }
  
  // Help responses
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return "I can help you with:\n- Customer analysis and insights\n- Process timeline and efficiency review\n- Team performance metrics\n- Service utilization reports\n- Contract renewal tracking\n- Data trends and patterns\n\nJust ask me about any aspect of your CRM data!";
  }
  
  return null;
};
