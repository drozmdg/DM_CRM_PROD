/**
 * AI Chat Configuration
 * 
 * This file contains configuration management for the AI chat functionality.
 */

import { OllamaConfig } from './types';
import { supabase } from '../supabase';

// Default Ollama configuration
export const defaultOllamaConfig: OllamaConfig = {
  endpoint: 'http://localhost:11434/api/generate',
  model: 'llama2', // Using llama2 as it's more commonly available
  temperature: 0.7,
  maxTokens: 500,
  useSystemPrompt: true,
  useFallback: true // Always use fallback responses if Ollama is unavailable
};

// Current configuration - can be updated at runtime
let ollamaConfig: OllamaConfig = { ...defaultOllamaConfig };

/**
 * Load configuration from Supabase
 * @returns Promise that resolves when configuration is loaded
 */
export const loadConfig = async (): Promise<OllamaConfig> => {
  try {
    const { data, error } = await supabase
      .from('ollama_config')
      .select('*')
      .single();

    if (error) {
      console.error('Error loading Ollama config from Supabase:', error);
      return ollamaConfig;
    }

    if (data) {
      ollamaConfig = { ...defaultOllamaConfig, ...data.config };
      console.log('Loaded Ollama config from Supabase:', ollamaConfig);
    }

    return ollamaConfig;
  } catch (error) {
    console.error('Exception loading Ollama config:', error);
    return ollamaConfig;
  }
};

/**
 * Update the Ollama configuration
 * @param config New configuration options
 * @returns Promise that resolves when configuration is updated
 */
export const updateOllamaConfig = async (config: Partial<OllamaConfig>): Promise<void> => {
  // Update the runtime configuration
  ollamaConfig = { ...ollamaConfig, ...config };

  // Save to Supabase for persistence
  try {
    const { error } = await supabase
      .from('ollama_config')
      .upsert({ id: 1, config: ollamaConfig })
      .select();

    if (error) {
      console.error('Error saving Ollama config to Supabase:', error);
    } else {
      console.log('Saved Ollama config to Supabase:', ollamaConfig);
    }
  } catch (error) {
    console.error('Exception saving Ollama config:', error);
  }
};

/**
 * Get the current Ollama configuration
 * @returns The current Ollama configuration
 */
export const getOllamaConfig = (): OllamaConfig => {
  return { ...ollamaConfig };
};