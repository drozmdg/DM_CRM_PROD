/**
 * Chat Context
 * 
 * React context for managing chat state and functionality.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ChatMessage, ChatSession } from '@/lib/ai-chat/types';
import { handleUserMessage } from '@/lib/ai-chat';

interface ChatContextType {
  // Sessions
  sessions: ChatSession[];
  currentSessionId: string | null;
  createSession: (title?: string) => ChatSession;
  deleteSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string) => void;
  
  // Messages
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  
  // Utility
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY_SESSIONS = 'retro_crm_chat_sessions';
const STORAGE_KEY_MESSAGES = 'retro_crm_chat_messages';

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
      
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions);
        setSessions(parsedSessions);
        
        // Set current session to the most recent one
        if (parsedSessions.length > 0) {
          const mostRecent = parsedSessions[parsedSessions.length - 1];
          setCurrentSessionId(mostRecent.id);
        }
      }
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Error loading chat data from localStorage:', error);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving sessions to localStorage:', error);
    }
  }, [sessions]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }, [messages]);

  // Filter messages for current session
  useEffect(() => {
    if (currentSessionId) {
      try {
        const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
        if (savedMessages) {
          const allMessages = JSON.parse(savedMessages);
          const sessionMessages = allMessages.filter((msg: any) => msg.sessionId === currentSessionId);
          setMessages(sessionMessages);
        }
      } catch (error) {
        console.error('Error loading session messages:', error);
      }
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const createSession = useCallback((title?: string): ChatSession => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || `Chat ${sessions.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
    setMessages([]); // Clear messages for new session
    
    return newSession;
  }, [sessions.length]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    
    // Remove messages for this session
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (savedMessages) {
        const allMessages = JSON.parse(savedMessages);
        const filteredMessages = allMessages.filter((msg: any) => msg.sessionId !== sessionId);
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(filteredMessages));
      }
    } catch (error) {
      console.error('Error removing session messages:', error);
    }
    
    // If this was the current session, clear it
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  }, [currentSessionId]);

  const setCurrentSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentSessionId || isLoading) return;

    setIsLoading(true);

    // Create user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      content,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      
      // Save to localStorage immediately
      try {
        const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
        const allMessages = savedMessages ? JSON.parse(savedMessages) : [];
        const updatedMessages = [...allMessages, { ...userMessage, sessionId: currentSessionId }];
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updatedMessages));
      } catch (error) {
        console.error('Error saving user message:', error);
      }
      
      return newMessages;
    });

    try {
      // Get AI response
      const aiResponse = await handleUserMessage(content);

      // Create AI message
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      // Add AI message
      setMessages(prev => {
        const newMessages = [...prev, aiMessage];
        
        // Save to localStorage immediately
        try {
          const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
          const allMessages = savedMessages ? JSON.parse(savedMessages) : [];
          const updatedMessages = [...allMessages, { ...aiMessage, sessionId: currentSessionId }];
          localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updatedMessages));
        } catch (error) {
          console.error('Error saving AI message:', error);
        }
        
        return newMessages;
      });

    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    
    // Also clear from localStorage for current session
    if (currentSessionId) {
      try {
        const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
        if (savedMessages) {
          const allMessages = JSON.parse(savedMessages);
          const filteredMessages = allMessages.filter((msg: any) => msg.sessionId !== currentSessionId);
          localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(filteredMessages));
        }
      } catch (error) {
        console.error('Error clearing messages:', error);
      }
    }
  }, [currentSessionId]);

  const value: ChatContextType = {
    sessions,
    currentSessionId,
    createSession,
    deleteSession,
    setCurrentSession,
    messages,
    sendMessage,
    isLoading,
    clearMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
