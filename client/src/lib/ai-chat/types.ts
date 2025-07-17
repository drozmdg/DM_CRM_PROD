/**
 * AI Chat Types
 * 
 * This file contains type definitions for the AI chat functionality.
 */

/**
 * Configuration for Ollama
 */
export interface OllamaConfig {
  endpoint: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  useSystemPrompt?: boolean;
}

/**
 * Interface for Ollama model information
 */
export interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

/**
 * CRM Data interface
 */
export interface CRMData {
  customers?: any[];
  processes?: any[];
  teams?: any[];
  services?: any[];
  products?: any[];
  contacts?: any[];
  documents?: any[];
  notes?: any[];
  tasks?: any[];
  importantDates?: any[];
  [key: string]: any;
}

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  isLoading?: boolean;
}

/**
 * Chat session interface
 */
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
