/**
 * Chat Service - Handles all AI chat-related database operations
 */

import { supabase } from '../supabase.js';
import type { ChatSession, ChatMessage, MessageSender } from '../../../shared/types/index.js';
import { processMessage } from '../ai-chat/api';
import { loadCRMData } from '../ai-chat/context';

export class ChatService {
  /**
   * Get all chat sessions for a user
   */
  async getChatSessions(userId?: string): Promise<ChatSession[]> {
    try {
      let query = supabase.from('chat_sessions').select('*');
      
      // Note: Current schema doesn't have user_id field, so we'll fetch all sessions
      // In the future, add user filtering when user_id field is added to schema
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching chat sessions:', error);
        // Return mock data for graceful degradation
        return this.getMockChatSessions();
      }
      
      // Map to include empty messages array since sessions don't store messages directly
      return (data || []).map(session => ({
        ...this.mapDbSessionToSession(session),
        messages: [] // Messages are fetched separately
      }));
    } catch (error) {
      console.error('Error in getChatSessions:', error);
      return this.getMockChatSessions();
    }
  }

  /**
   * Get a specific chat session by ID
   */
  async getChatSession(id: string): Promise<ChatSession | null> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (sessionError) {
        console.error('Error fetching chat session:', sessionError);
        return null;
      }

      // Get messages for this session
      const messages = await this.getChatMessages(id);
      
      return {
        ...this.mapDbSessionToSession(session),
        messages
      };
    } catch (error) {
      console.error('Error in getChatSession:', error);
      return null;
    }
  }

  /**
   * Create a new chat session
   */
  async createChatSession(session: Partial<ChatSession>): Promise<ChatSession> {
    try {
      const sessionData = {
        id: session.id || crypto.randomUUID(),
        title: session.title || 'New Chat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([sessionData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating chat session:', error);
        throw new Error(`Failed to create chat session: ${error.message}`);
      }
      
      return {
        ...this.mapDbSessionToSession(data),
        messages: []
      };
    } catch (error) {
      console.error('Error in createChatSession:', error);
      throw error;
    }
  }

  /**
   * Update an existing chat session
   */
  async updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .update({
          title: updates.title,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating chat session:', error);
        throw new Error(`Failed to update chat session: ${error.message}`);
      }
      
      // Get updated messages
      const messages = await this.getChatMessages(id);
      
      return {
        ...this.mapDbSessionToSession(data),
        messages
      };
    } catch (error) {
      console.error('Error in updateChatSession:', error);
      throw error;
    }
  }

  /**
   * Delete a chat session and its messages
   */
  async deleteChatSession(id: string): Promise<void> {
    try {
      // Delete messages first
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', id);

      // Delete session
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting chat session:', error);
        throw new Error(`Failed to delete chat session: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteChatSession:', error);
      throw error;
    }
  }
  /**
   * Get all messages for a chat session
   */
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      console.log("Getting chat messages for session:", sessionId);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });
      
      if (error) {
        console.error('Error fetching chat messages:', error);
        return this.getMockChatMessages();
      }
      
      console.log("Raw message data from database:", JSON.stringify(data, null, 2));
      const mappedMessages = (data || []).map(this.mapDbMessageToMessage);
      console.log("Mapped messages:", JSON.stringify(mappedMessages, null, 2));
      return mappedMessages;
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      return this.getMockChatMessages();
    }
  }

  /**
   * Get a specific chat message by ID
   */
  async getChatMessage(id: string): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching chat message:', error);
        return null;
      }
      
      return this.mapDbMessageToMessage(data);
    } catch (error) {
      console.error('Error in getChatMessage:', error);
      return null;
    }
  }
  /**
   * Create a new chat message
   */
  async createChatMessage(message: Partial<ChatMessage> & { sessionId: string }): Promise<ChatMessage> {
    try {
      const messageData = {
        id: message.id || crypto.randomUUID(),
        session_id: message.sessionId,
        content: message.content || '',
        sender: message.sender || 'user',
        timestamp: message.timestamp || new Date().toISOString(),
        is_loading: message.isLoading || false
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([messageData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating chat message:', error);
        throw new Error(`Failed to create chat message: ${error.message}`);
      }

      // Update session's updated_at timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', message.sessionId);
        // If this is a user message, generate an AI response
      if (message.sender === 'user') {
        try {
          console.log("Processing user message:", message.content);
          
          // Create a placeholder AI message
          const aiPlaceholder = {
            sessionId: message.sessionId,
            content: '...',
            sender: 'ai' as MessageSender,
            isLoading: true
          };
          
          const aiMessage = await this.createChatMessage(aiPlaceholder);
          console.log("Created AI placeholder message:", aiMessage.id);
          
          // Always use fallback to ensure response
          const { getFallbackResponse } = await import('../ai-chat/responses.js');
          const response = getFallbackResponse(message.content || '');
          console.log("Generated fallback response:", response.substring(0, 50) + "...");
          
          // Update the placeholder with the response
          await this.updateChatMessage(aiMessage.id, { 
            content: response,
            isLoading: false
          });
          console.log("Updated AI message with response");
        } catch (aiError) {
          console.error('Error generating AI response:', aiError);
          // Create an error message if AI generation fails
          await this.createChatMessage({
            sessionId: message.sessionId,
            content: 'Sorry, I encountered an error while processing your request. Please try again later.',
            sender: 'ai' as MessageSender
          });
        }
      }
      
      return this.mapDbMessageToMessage(data);
    } catch (error) {
      console.error('Error in createChatMessage:', error);
      throw error;
    }
  }

  /**
   * Update an existing chat message
   */
  async updateChatMessage(id: string, updates: Partial<ChatMessage>): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          content: updates.content,
          sender: updates.sender,
          timestamp: updates.timestamp,
          is_loading: updates.isLoading
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating chat message:', error);
        throw new Error(`Failed to update chat message: ${error.message}`);
      }
      
      return this.mapDbMessageToMessage(data);
    } catch (error) {
      console.error('Error in updateChatMessage:', error);
      throw error;
    }
  }

  /**
   * Delete a chat message
   */
  async deleteChatMessage(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting chat message:', error);
        throw new Error(`Failed to delete chat message: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteChatMessage:', error);
      throw error;
    }
  }

  /**
   * Get chat metrics
   */
  async getChatMetrics(): Promise<{
    totalSessions: number;
    totalMessages: number;
    avgMessagesPerSession: number;
    recentSessions: number;
  }> {
    try {
      const { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id, created_at');

      const { data: messages, error: messageError } = await supabase
        .from('chat_messages')
        .select('id');

      if (sessionError || messageError) {
        console.error('Error getting chat metrics:', sessionError || messageError);
        return {
          totalSessions: 0,
          totalMessages: 0,
          avgMessagesPerSession: 0,
          recentSessions: 0
        };
      }

      const totalSessions = sessions.length;
      const totalMessages = messages.length;
      const avgMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;

      // Count sessions created in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentSessions = sessions.filter(session => 
        new Date(session.created_at) >= sevenDaysAgo
      ).length;

      return {
        totalSessions,
        totalMessages,
        avgMessagesPerSession: Math.round(avgMessagesPerSession * 100) / 100,
        recentSessions
      };
    } catch (error) {
      console.error('Error getting chat metrics:', error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        avgMessagesPerSession: 0,
        recentSessions: 0
      };
    }
  }

  /**
   * Map database session to application session
   */
  private mapDbSessionToSession(dbSession: any): Omit<ChatSession, 'messages'> {
    return {
      id: dbSession.id,
      title: dbSession.title,
      createdAt: dbSession.created_at,
      updatedAt: dbSession.updated_at
    };
  }  /**
   * Map database message to application message
   */
  private mapDbMessageToMessage(dbMessage: any): ChatMessage {
    return {
      id: dbMessage.id,
      content: dbMessage.content,
      sender: dbMessage.sender,
      timestamp: dbMessage.timestamp,
      isLoading: dbMessage.is_loading
    };
  }

  /**
   * Get mock chat sessions for graceful degradation
   */
  private getMockChatSessions(): ChatSession[] {
    return [
      {
        id: 'mock-session-1',
        title: 'Customer Analysis Chat',
        messages: [
          {
            id: 'mock-msg-1',
            content: 'Hello! How can I help you analyze your CRM data today?',
            sender: 'ai',
            timestamp: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Get mock chat messages for graceful degradation
   */
  private getMockChatMessages(): ChatMessage[] {
    return [
      {
        id: 'mock-msg-1',
        content: 'Hello! I can help you analyze your CRM data, track customer progress, and provide insights about your business. What would you like to know?',
        sender: 'ai',
        timestamp: new Date().toISOString()
      }
    ];
  }
}
