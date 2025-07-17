import React from 'react';
import ChatDataProvider from './ChatDataProvider';

interface OptionalChatDataProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

/**
 * Wrapper for ChatDataProvider that can be disabled
 * This helps isolate issues with the chat data fetching
 */
const OptionalChatDataProvider: React.FC<OptionalChatDataProviderProps> = ({ 
  children, 
  enabled = true 
}) => {
  if (!enabled) {
    console.log('⚠️ ChatDataProvider is disabled');
    return <>{children}</>;
  }
  
  return <ChatDataProvider>{children}</ChatDataProvider>;
};

export default OptionalChatDataProvider;