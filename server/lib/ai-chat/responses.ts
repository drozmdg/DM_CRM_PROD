/**
 * AI Chat Responses
 * 
 * This file contains fallback responses for when Ollama is not available.
 */

/**
 * Get a fallback response based on the user's message
 * @param message The user's message
 * @returns A fallback response
 */
export const getFallbackResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Check for greetings
  if (containsAny(lowerMessage, ['hello', 'hi', 'hey', 'greetings'])) {
    return "Hello! I'm operating in fallback mode as I can't connect to Ollama right now. I can still provide some basic information about the CRM system.";
  }
  
  // Check for questions about the CRM
  if (lowerMessage.includes('crm') || lowerMessage.includes('dashboard')) {
    return "The Sales Dashboard is a comprehensive CRM system designed to help manage customer relationships, track processes, and monitor team performance. It includes features for document management, timeline visualization, and AI-powered insights.";
  }
  
  // Check for customer-related queries
  if (containsAny(lowerMessage, ['customer', 'customers', 'client'])) {
    return "The CRM system allows you to manage customers, including their contacts, processes, and associated documents. I can't access specific customer data in fallback mode, but when connected to Ollama, I can provide detailed insights about your customers.";
  }
  
  // Check for process-related queries
  if (containsAny(lowerMessage, ['process', 'processes', 'sdlc', 'project'])) {
    return "The CRM system includes comprehensive process management with SDLC tracking, approval workflows, and dependency management. When connected to Ollama, I can provide specific information about your processes.";
  }
  
  // Check for document-related queries
  if (containsAny(lowerMessage, ['document', 'documents', 'file', 'files'])) {
    return "The CRM system includes a document management system with upload, search, and preview capabilities. You can organize documents by customer and category for easy access.";
  }
  
  // Check for help requests
  if (containsAny(lowerMessage, ['help', 'assist', 'how do i', 'how to'])) {
    return "I'm currently in fallback mode with limited functionality. To get the most out of the AI assistant, please ensure Ollama is running on your machine. You can start it by running 'ollama serve' in your terminal.";
  }
  
  // Default fallback response
  return "I'm currently operating in fallback mode as I can't connect to Ollama. I can provide limited responses about the CRM system, but can't access specific data. Please ensure Ollama is running to unlock my full capabilities.";
};

/**
 * Check if a string contains any of the given keywords
 * @param text The text to check
 * @param keywords Array of keywords to check for
 * @returns True if any keyword is found, false otherwise
 */
function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}
