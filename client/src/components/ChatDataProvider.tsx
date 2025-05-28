/**
 * Chat Data Provider
 * 
 * This component connects the CRM data context with the AI chat functionality.
 */

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { setCRMData } from '@/lib/ai-chat';
import { apiRequest } from '@/lib/queryClient';

interface ChatDataProviderProps {
  children: React.ReactNode;
}

const ChatDataProvider: React.FC<ChatDataProviderProps> = ({ children }) => {
  // Fetch customers data to provide context to the AI
  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiRequest('GET', '/api/customers').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch processes data
  const { data: processes } = useQuery({
    queryKey: ['/api/processes'],
    queryFn: () => apiRequest('GET', '/api/processes').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch teams data
  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: () => apiRequest('GET', '/api/teams').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch services data
  const { data: services } = useQuery({
    queryKey: ['/api/services'],
    queryFn: () => apiRequest('GET', '/api/services').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update CRM data context when data changes
  useEffect(() => {
    const crmData = {
      customers: customers || [],
      processes: processes || [],
      teams: teams || [],
      services: services || []
    };

    // Set the CRM data for AI context generation
    setCRMData(crmData);
    
    console.log('Updated CRM data context for AI:', {
      customerCount: crmData.customers.length,
      processCount: crmData.processes.length,
      teamCount: crmData.teams.length,
      serviceCount: crmData.services.length
    });
  }, [customers, processes, teams, services]);

  return <>{children}</>;
};

export default ChatDataProvider;
