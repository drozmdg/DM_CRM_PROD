/**
 * AI Chat Index
 * 
 * Main export file for the AI chat functionality.
 */

// Export types
export type { OllamaConfig, OllamaModelInfo, CRMData, ChatMessage, ChatSession } from './types';

// Export configuration functions
export { 
  defaultOllamaConfig, 
  updateOllamaConfig, 
  getOllamaConfig 
} from './config';

// Export context functions
export { setCRMData, generateSystemPrompt } from './context';

// Export response functions
export { getFallbackResponse, getKeywordResponse } from './responses';

// Export API functions
export { 
  fetchAvailableModels, 
  processMessage, 
  handleUserMessage 
} from './api';
