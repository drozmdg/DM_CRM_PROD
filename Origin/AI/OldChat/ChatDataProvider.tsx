import React, { useEffect } from 'react';
import { useCustomers } from '@/context/CustomerContext';
import { setCRMData } from '@/lib/ai-chat/context';

/**
 * This component connects the CustomerContext with the AI chat functionality.
 * It passes the customer data to the AI chat module so it can be used for context.
 */
const ChatDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { customers } = useCustomers();

  // Update the CRM data whenever customers change
  useEffect(() => {
    setCRMData({ customers });
  }, [customers]);

  return <>{children}</>;
};

export default ChatDataProvider;
