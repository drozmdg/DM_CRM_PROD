/**
 * AI Chat Configuration
 * 
 * This file contains configuration management for the AI chat functionality.
 */

import { OllamaConfig } from './types';

// Storage key for Ollama configuration
const OLLAMA_CONFIG_STORAGE_KEY = 'retro_crm_ollama_config';

// Default Ollama configuration
export const defaultOllamaConfig: OllamaConfig = {
  endpoint: 'http://localhost:11434/api/generate',
  model: 'llama2', // Using llama2 as it's more commonly available
  temperature: 0.7,
  maxTokens: 500,
  useSystemPrompt: true
};

// Current configuration - can be updated at runtime
let ollamaConfig: OllamaConfig = loadSavedConfig();

/**
 * Load configuration from localStorage or use default
 * @returns The loaded configuration or default if not found
 */
function loadSavedConfig(): OllamaConfig {
  try {
    const savedConfig = localStorage.getItem(OLLAMA_CONFIG_STORAGE_KEY);
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      console.log('Loaded Ollama config from localStorage:', parsedConfig);
      return { ...defaultOllamaConfig, ...parsedConfig };
    }
  } catch (error) {
    console.error('Error loading Ollama config from localStorage:', error);
  }
  return { ...defaultOllamaConfig };
}

/**
 * Update the Ollama configuration
 * @param config New configuration options
 */
export const updateOllamaConfig = (config: Partial<OllamaConfig>): void => {
  // Update the runtime configuration
  ollamaConfig = { ...ollamaConfig, ...config };

  // Save to localStorage for persistence
  try {
    localStorage.setItem(OLLAMA_CONFIG_STORAGE_KEY, JSON.stringify(ollamaConfig));
    console.log('Saved Ollama config to localStorage:', ollamaConfig);
  } catch (error) {
    console.error('Error saving Ollama config to localStorage:', error);
  }
};

/**
 * Get the current Ollama configuration
 * @returns The current Ollama configuration
 */
export const getOllamaConfig = (): OllamaConfig => {
  return { ...ollamaConfig };
};
