/**
 * Chat Migration Utilities
 * 
 * This file contains functions for migrating chat data from localStorage to Supabase.
 */

import { supabase, getCurrentTimestamp } from '../supabase';
import { MigrationStatus, STORAGE_KEYS } from './types';
import { getLocalStorageData } from './utils';

/**
 * Migrate chat sessions from localStorage to Supabase
 * @returns Promise that resolves to a MigrationStatus object
 */
export const migrateChatSessions = async (): Promise<MigrationStatus> => {
  try {
    // Get chat sessions from localStorage
    const chatSessions = getLocalStorageData<any[]>(STORAGE_KEYS.CHAT_SESSIONS);

    if (!chatSessions || chatSessions.length === 0) {
      return {
        success: false,
        message: 'No chat sessions found in localStorage'
      };
    }

    let chatSessionsCount = 0;
    let chatMessagesCount = 0;

    // Migrate each chat session and its messages
    for (const session of chatSessions) {
      // Insert chat session
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .upsert({
          id: session.id,
          title: session.title,
          created_at: session.createdAt || getCurrentTimestamp(),
          updated_at: session.updatedAt || getCurrentTimestamp()
        });

      if (sessionError) {
        console.error('Error inserting chat session:', sessionError);
        continue;
      }

      chatSessionsCount++;

      // Insert chat messages
      if (session.messages && session.messages.length > 0) {
        const messages = session.messages.map((message: any) => ({
          id: message.id,
          session_id: session.id,
          content: message.content,
          sender: message.sender,
          timestamp: message.timestamp || getCurrentTimestamp(),
          is_loading: message.isLoading || false
        }));

        const { error: messagesError } = await supabase
          .from('chat_messages')
          .upsert(messages);

        if (messagesError) {
          console.error('Error inserting chat messages:', messagesError);
        } else {
          chatMessagesCount += messages.length;
        }
      }
    }

    return {
      success: true,
      message: 'Chat sessions migration completed successfully',
      details: {
        chatSessionsCount,
        chatMessagesCount
      }
    };
  } catch (error) {
    console.error('Error migrating chat sessions:', error);
    return {
      success: false,
      message: 'Error migrating chat sessions',
      error
    };
  }
};

/**
 * Migrate Ollama configuration from localStorage to Supabase
 * @returns Promise that resolves to a MigrationStatus object
 */
export const migrateOllamaConfig = async (): Promise<MigrationStatus> => {
  try {
    // Get Ollama config from localStorage
    const ollamaConfig = getLocalStorageData<any>(STORAGE_KEYS.OLLAMA_CONFIG);

    if (!ollamaConfig) {
      return {
        success: false,
        message: 'No Ollama configuration found in localStorage'
      };
    }

    // Insert Ollama config
    const { error } = await supabase
      .from('ollama_config')
      .upsert({
        id: 1, // Always update the first record
        endpoint: ollamaConfig.endpoint || 'http://localhost:11434/api/generate',
        model: ollamaConfig.model || 'llama2',
        temperature: ollamaConfig.temperature || 0.7,
        max_tokens: ollamaConfig.maxTokens || 500,
        use_system_prompt: ollamaConfig.useSystemPrompt !== undefined ? ollamaConfig.useSystemPrompt : true,
        updated_at: getCurrentTimestamp()
      });

    if (error) {
      console.error('Error inserting Ollama config:', error);
      return {
        success: false,
        message: 'Error migrating Ollama configuration',
        error
      };
    }

    return {
      success: true,
      message: 'Ollama configuration migration completed successfully'
    };
  } catch (error) {
    console.error('Error migrating Ollama config:', error);
    return {
      success: false,
      message: 'Error migrating Ollama configuration',
      error
    };
  }
};
