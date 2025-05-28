/**
 * AI Chat API
 * 
 * This file contains API functions for communicating with the Ollama API.
 */

import { OllamaModelInfo } from './types';
import { getOllamaConfig } from './config';
import { generateSystemPrompt } from './context';
import { getFallbackResponse } from './responses';

/**
 * Fetch available models from Ollama
 * @param endpoint The Ollama API endpoint
 * @returns Promise that resolves to an array of model names
 */
export const fetchAvailableModels = async (endpoint?: string): Promise<OllamaModelInfo[]> => {
  try {
    // Use the provided endpoint or the current configuration
    const apiEndpoint = endpoint || getOllamaConfig().endpoint;

    // Extract the base URL from the endpoint (remove /api/generate if present)
    const baseUrl = apiEndpoint.replace('/api/generate', '');

    // Construct the models endpoint
    const modelsEndpoint = `${baseUrl}/api/tags`;

    const response = await fetch(modelsEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return [];
  }
};

/**
 * Process a message using the Ollama API
 * @param message The user's message
 * @returns Promise that resolves to the AI's response
 */
export const processMessage = async (message: string): Promise<string> => {
  try {
    const config = getOllamaConfig();
    
    // Prepare the request body
    const requestBody: any = {
      model: config.model,
      prompt: message,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false,
    };

    // Add system prompt if enabled
    if (config.useSystemPrompt) {
      requestBody.system = generateSystemPrompt();
    }

    const response = await fetch(config.endpoint, {
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
        throw new Error(`Model '${config.model}' not found. Please make sure you have pulled this model using 'ollama pull ${config.model}' or select a different model in the AI Config.`);
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
