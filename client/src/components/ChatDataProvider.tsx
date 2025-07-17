/**
 * Chat Data Provider
 * 
 * This component connects the CRM data context with the AI chat functionality.
 */

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { setCRMData } from '@/lib/ai-chat';
import { useApiClient } from '@/lib/authenticatedApiClient';

interface ChatDataProviderProps {
  children: React.ReactNode;
}

const ChatDataProvider: React.FC<ChatDataProviderProps> = ({ children }) => {  
  const apiClient = useApiClient();
  
  // Fetch customers data to provide context to the AI
  const { data: customers, error: customersError } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      try {
        return await apiClient.get('/customers');
      } catch (error) {
        console.error('Failed to fetch customers for chat context:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch processes data
  const { data: processes, error: processesError } = useQuery({
    queryKey: ['/api/processes'],
    queryFn: async () => {
      try {
        return await apiClient.get('/processes');
      } catch (error) {
        console.error('Failed to fetch processes for chat context:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch teams data
  const { data: teams, error: teamsError } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      try {
        return await apiClient.get('/teams');
      } catch (error) {
        console.error('Failed to fetch teams for chat context:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch services data
  const { data: services, error: servicesError } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      try {
        return await apiClient.get('/services');
      } catch (error) {
        console.error('Failed to fetch services for chat context:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch products data
  const { data: products, error: productsError } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      try {
        return await apiClient.get('/products');
      } catch (error) {
        console.error('Failed to fetch products for chat context:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch contacts data
  const { data: contacts, error: contactsError } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: async () => {
      try {
        return await apiClient.get('/contacts');
      } catch (error) {
        console.error('Failed to fetch contacts for chat context:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch documents data
  const { data: documents, error: documentsError } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      try {
        return await apiClient.get('/documents');
      } catch (error) {
        console.error('Failed to fetch documents for chat context:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  });
  
  // Update CRM data context when data changes
  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('ChatDataProvider: Data status:', { 
        customersError, 
        processesError, 
        teamsError, 
        servicesError,
        productsError,
        contactsError,
        documentsError
      });
    }
    
    const crmData = {
      customers: customers || [],
      processes: processes || [],
      teams: teams || [],
      services: services || [],
      products: products || [],
      contacts: contacts || [],
      documents: documents || []
    };

    // Set the CRM data for AI context generation
    try {
      setCRMData(crmData);
    } catch (error) {
      console.error('Failed to set CRM data context:', error);
    }
  }, [customers, processes, teams, services, products, contacts, documents, customersError, processesError, teamsError, servicesError, productsError, contactsError, documentsError]);

  return <>{children}</>;
};

export default ChatDataProvider;
