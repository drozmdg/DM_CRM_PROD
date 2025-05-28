/**
 * AI Chat Responses
 * 
 * This file contains functions for generating AI responses.
 */

import { getKeywordResponse } from './keywords';

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
 * Main function to handle a user message and generate a response
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
  // Import here to avoid circular dependency
  const { processMessage } = await import('./api');
  return processMessage(message);
};
