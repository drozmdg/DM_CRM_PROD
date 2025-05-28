/**
 * Migration Test Utilities
 *
 * This file contains utilities for testing the data migration process from localStorage to Supabase.
 * It includes functions for generating test data, populating localStorage, and verifying migration results.
 */

import { v4 as uuidv4 } from 'uuid';
import { Customer, Process, Team, Service, Contact, Document, TimelineEvent, ChatSession, ChatMessage } from '@/types';
import { supabase } from './supabase';

// Import storage keys from migration module
import { STORAGE_KEYS } from './migration';

/**
 * Generate a test customer with related entities
 * @returns A test customer object
 */
export const generateTestCustomer = (): Customer => {
  const customerId = `test-c-${uuidv4().substring(0, 8)}`;

  // Generate teams
  const teams: Team[] = [
    {
      id: `test-t-${uuidv4().substring(0, 8)}`,
      name: 'Test Development Team',
      financeCode: 'TEST-DEV-001'
    },
    {
      id: `test-t-${uuidv4().substring(0, 8)}`,
      name: 'Test QA Team',
      financeCode: 'TEST-QA-001'
    }
  ];

  // Generate services
  const services: Service[] = [
    {
      id: `test-s-${uuidv4().substring(0, 8)}`,
      name: 'Test Development Service',
      monthlyHours: 40
    },
    {
      id: `test-s-${uuidv4().substring(0, 8)}`,
      name: 'Test Support Service',
      monthlyHours: 20
    }
  ];

  // Generate processes
  const processes: Process[] = [
    {
      id: `test-p-${uuidv4().substring(0, 8)}`,
      name: 'Test Feature Development',
      jiraTicket: 'TEST-123',
      status: 'In Progress',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sdlcStage: 'Development',
      estimate: 40,
      devSprint: 'Sprint 1',
      approvalStatus: 'Approved',
      approvedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      functionalArea: 'Standard Data Ingestion',
      timeline: [
        {
          id: `test-pt-${uuidv4().substring(0, 8)}`,
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          stage: 'Requirements',
          description: 'Requirements gathering completed'
        },
        {
          id: `test-pt-${uuidv4().substring(0, 8)}`,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          stage: 'Design',
          description: 'Design phase completed'
        },
        {
          id: `test-pt-${uuidv4().substring(0, 8)}`,
          date: new Date().toISOString().split('T')[0],
          stage: 'Development',
          description: 'Development in progress'
        }
      ]
    },
    {
      id: `test-p-${uuidv4().substring(0, 8)}`,
      name: 'Test Bug Fix',
      jiraTicket: 'TEST-456',
      status: 'Completed',
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sdlcStage: 'Maintenance',
      estimate: 8,
      approvalStatus: 'Not Required',
      functionalArea: 'CRM Refresh',
      timeline: [
        {
          id: `test-pt-${uuidv4().substring(0, 8)}`,
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          stage: 'Requirements',
          description: 'Bug reported'
        },
        {
          id: `test-pt-${uuidv4().substring(0, 8)}`,
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          stage: 'Development',
          description: 'Fix implemented'
        },
        {
          id: `test-pt-${uuidv4().substring(0, 8)}`,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          stage: 'Testing',
          description: 'Fix tested'
        },
        {
          id: `test-pt-${uuidv4().substring(0, 8)}`,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          stage: 'Maintenance',
          description: 'Fix deployed'
        }
      ]
    }
  ];

  // Generate contacts
  const contacts: Contact[] = [
    {
      id: `test-c-${uuidv4().substring(0, 8)}`,
      name: 'Test Client Contact',
      title: 'Project Manager',
      email: 'client@example.com',
      phone: '555-123-4567',
      role: 'Primary Contact',
      type: 'Client'
    },
    {
      id: `test-c-${uuidv4().substring(0, 8)}`,
      name: 'Test Internal Contact',
      title: 'Account Manager',
      email: 'internal@example.com',
      phone: '555-987-6543',
      role: 'Account Manager',
      type: 'Internal'
    }
  ];

  // Generate documents
  const documents: Document[] = [
    {
      id: `test-d-${uuidv4().substring(0, 8)}`,
      name: 'Test Contract',
      description: 'Test contract document',
      url: 'https://example.com/test-contract.pdf',
      uploadDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'PDF',
      category: 'Contract',
      size: 1024 * 1024 // 1MB
    },
    {
      id: `test-d-${uuidv4().substring(0, 8)}`,
      name: 'Test Requirements',
      description: 'Test requirements document',
      url: 'https://example.com/test-requirements.docx',
      uploadDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'DOCX',
      category: 'Requirements',
      size: 512 * 1024 // 512KB
    }
  ];

  // Generate timeline events
  const timeline: TimelineEvent[] = [
    {
      id: `test-tl-${uuidv4().substring(0, 8)}`,
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      title: 'Contract Signed',
      description: 'Initial contract signed',
      type: 'phase-change',
      icon: 'file-signature'
    },
    {
      id: `test-tl-${uuidv4().substring(0, 8)}`,
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      title: 'Project Kickoff',
      description: 'Project kickoff meeting',
      type: 'project-added',
      icon: 'play'
    },
    {
      id: `test-tl-${uuidv4().substring(0, 8)}`,
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      title: 'Phase Change',
      description: 'Moved to Steady State',
      type: 'phase-change',
      icon: 'arrow-right'
    }
  ];

  // Create the customer object
  return {
    id: customerId,
    name: 'Test Customer Inc.',
    logo: undefined,
    avatarColor: '#6d28d9', // Purple
    phase: 'Steady State',
    contractStart: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contractEnd: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    teams,
    services,
    processes,
    contacts,
    documents,
    timeline
  };
};

/**
 * Generate test chat sessions
 * @returns An array of test chat sessions
 */
export const generateTestChatSessions = (): ChatSession[] => {
  const chatSession1: ChatSession = {
    id: `test-cs-${uuidv4().substring(0, 8)}`,
    title: 'Test Chat 1',
    messages: [
      {
        id: `test-msg-${uuidv4().substring(0, 8)}`,
        content: 'Hello, I need information about Test Customer Inc.',
        sender: 'user',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      {
        id: `test-msg-${uuidv4().substring(0, 8)}`,
        content: 'Test Customer Inc. is in Steady State phase with a contract ending in about 9 months.',
        sender: 'ai',
        timestamp: new Date(Date.now() - 59 * 60 * 1000).toISOString()
      },
      {
        id: `test-msg-${uuidv4().substring(0, 8)}`,
        content: 'How many processes do they have?',
        sender: 'user',
        timestamp: new Date(Date.now() - 58 * 60 * 1000).toISOString()
      },
      {
        id: `test-msg-${uuidv4().substring(0, 8)}`,
        content: 'They have 2 processes: "Test Feature Development" which is in progress, and "Test Bug Fix" which is completed.',
        sender: 'ai',
        timestamp: new Date(Date.now() - 57 * 60 * 1000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 57 * 60 * 1000).toISOString()
  };

  const chatSession2: ChatSession = {
    id: `test-cs-${uuidv4().substring(0, 8)}`,
    title: 'Test Chat 2',
    messages: [
      {
        id: `test-msg-${uuidv4().substring(0, 8)}`,
        content: 'What services do we provide to Test Customer Inc.?',
        sender: 'user',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: `test-msg-${uuidv4().substring(0, 8)}`,
        content: 'We provide "Test Development Service" (40 hours/month) and "Test Support Service" (20 hours/month) to Test Customer Inc.',
        sender: 'ai',
        timestamp: new Date(Date.now() - 29 * 60 * 1000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 29 * 60 * 1000).toISOString()
  };

  return [chatSession1, chatSession2];
};

/**
 * Generate test Ollama configuration
 * @returns Test Ollama configuration
 */
export const generateTestOllamaConfig = () => {
  return {
    endpoint: 'http://localhost:11434/api/generate',
    model: 'llama2',
    temperature: 0.7,
    maxTokens: 500,
    useSystemPrompt: true
  };
};

/**
 * Populate localStorage with test data
 */
export const populateTestData = () => {
  // Generate test customer
  const testCustomer = generateTestCustomer();

  // Get existing customers or initialize empty array
  const existingCustomers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');

  // Add test customer to existing customers
  const updatedCustomers = [...existingCustomers, testCustomer];

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));

  // Generate test chat sessions
  const testChatSessions = generateTestChatSessions();

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(testChatSessions));

  // Generate test Ollama config
  const testOllamaConfig = generateTestOllamaConfig();

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.OLLAMA_CONFIG, JSON.stringify(testOllamaConfig));

  console.log('Test data populated in localStorage:');
  console.log('- Customers:', updatedCustomers.length);
  console.log('- Chat Sessions:', testChatSessions.length);
  console.log('- Ollama Config:', testOllamaConfig);

  return {
    customers: updatedCustomers,
    chatSessions: testChatSessions,
    ollamaConfig: testOllamaConfig
  };
};

/**
 * Clear test data from localStorage
 */
export const clearTestData = () => {
  // Get existing customers
  const existingCustomers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');

  // Filter out test customers
  const filteredCustomers = existingCustomers.filter((customer: Customer) => !customer.id.startsWith('test-'));

  // Save filtered customers back to localStorage
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filteredCustomers));

  // Clear test chat sessions
  localStorage.removeItem(STORAGE_KEYS.CHAT_SESSIONS);

  // Clear test Ollama config
  localStorage.removeItem(STORAGE_KEYS.OLLAMA_CONFIG);

  console.log('Test data cleared from localStorage');
};

/**
 * Verify migration results in Supabase
 */
export const verifyMigrationResults = async () => {
  try {
    // Get customers from Supabase
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .ilike('id', 'test-%');

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return false;
    }

    // Get teams from Supabase
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .ilike('id', 'test-%');

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return false;
    }

    // Get services from Supabase
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .ilike('id', 'test-%');

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return false;
    }

    // Get processes from Supabase
    const { data: processes, error: processesError } = await supabase
      .from('processes')
      .select('*')
      .ilike('id', 'test-%');

    if (processesError) {
      console.error('Error fetching processes:', processesError);
      return false;
    }

    // Get contacts from Supabase
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .ilike('id', 'test-%');

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return false;
    }

    // Get documents from Supabase
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .ilike('id', 'test-%');

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return false;
    }

    // Get timeline events from Supabase
    const { data: timelineEvents, error: timelineEventsError } = await supabase
      .from('timeline_events')
      .select('*')
      .ilike('id', 'test-%');

    if (timelineEventsError) {
      console.error('Error fetching timeline events:', timelineEventsError);
      return false;
    }

    // Get chat sessions from Supabase
    const { data: chatSessions, error: chatSessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .ilike('id', 'test-%');

    if (chatSessionsError) {
      console.error('Error fetching chat sessions:', chatSessionsError);
      return false;
    }

    // Get chat messages from Supabase
    const { data: chatMessages, error: chatMessagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .ilike('session_id', 'test-%');

    if (chatMessagesError) {
      console.error('Error fetching chat messages:', chatMessagesError);
      return false;
    }

    // Get Ollama config from Supabase
    const { data: ollamaConfig, error: ollamaConfigError } = await supabase
      .from('ollama_config')
      .select('*')
      .limit(1);

    if (ollamaConfigError) {
      console.error('Error fetching Ollama config:', ollamaConfigError);
      return false;
    }

    // Log verification results
    console.log('Migration verification results:');
    console.log('- Customers:', customers.length);
    console.log('- Teams:', teams.length);
    console.log('- Services:', services.length);
    console.log('- Processes:', processes.length);
    console.log('- Contacts:', contacts.length);
    console.log('- Documents:', documents.length);
    console.log('- Timeline Events:', timelineEvents.length);
    console.log('- Chat Sessions:', chatSessions.length);
    console.log('- Chat Messages:', chatMessages.length);
    console.log('- Ollama Config:', ollamaConfig);

    return true;
  } catch (error) {
    console.error('Error verifying migration results:', error);
    return false;
  }
};

/**
 * Clean up test data from Supabase
 */
export const cleanupTestData = async () => {
  try {
    // Delete chat messages
    const { error: chatMessagesError } = await supabase
      .from('chat_messages')
      .delete()
      .ilike('session_id', 'test-%');

    if (chatMessagesError) {
      console.error('Error deleting chat messages:', chatMessagesError);
    }

    // Delete chat sessions
    const { error: chatSessionsError } = await supabase
      .from('chat_sessions')
      .delete()
      .ilike('id', 'test-%');

    if (chatSessionsError) {
      console.error('Error deleting chat sessions:', chatSessionsError);
    }

    // Delete timeline events
    const { error: timelineEventsError } = await supabase
      .from('timeline_events')
      .delete()
      .ilike('id', 'test-%');

    if (timelineEventsError) {
      console.error('Error deleting timeline events:', timelineEventsError);
    }

    // Delete process timeline events
    const { error: processTimelineEventsError } = await supabase
      .from('process_timeline_events')
      .delete()
      .ilike('id', 'test-%');

    if (processTimelineEventsError) {
      console.error('Error deleting process timeline events:', processTimelineEventsError);
    }

    // Delete documents
    const { error: documentsError } = await supabase
      .from('documents')
      .delete()
      .ilike('id', 'test-%');

    if (documentsError) {
      console.error('Error deleting documents:', documentsError);
    }

    // Delete contacts
    const { error: contactsError } = await supabase
      .from('contacts')
      .delete()
      .ilike('id', 'test-%');

    if (contactsError) {
      console.error('Error deleting contacts:', contactsError);
    }

    // Delete processes
    const { error: processesError } = await supabase
      .from('processes')
      .delete()
      .ilike('id', 'test-%');

    if (processesError) {
      console.error('Error deleting processes:', processesError);
    }

    // Delete services
    const { error: servicesError } = await supabase
      .from('services')
      .delete()
      .ilike('id', 'test-%');

    if (servicesError) {
      console.error('Error deleting services:', servicesError);
    }

    // Delete teams
    const { error: teamsError } = await supabase
      .from('teams')
      .delete()
      .ilike('id', 'test-%');

    if (teamsError) {
      console.error('Error deleting teams:', teamsError);
    }

    // Delete customers
    const { error: customersError } = await supabase
      .from('customers')
      .delete()
      .ilike('id', 'test-%');

    if (customersError) {
      console.error('Error deleting customers:', customersError);
    }

    console.log('Test data cleaned up from Supabase');
    return true;
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    return false;
  }
};
