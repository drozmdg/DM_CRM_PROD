// Storage implementation with database services and in-memory fallback
import { databaseService } from './lib/database/index.js';

import { 
  User,
  Customer, 
  Contact, 
  Team, 
  Service, 
  Process, 
  Document, 
  TimelineEvent,
  ChatSession,
  ChatMessage,
  Communication,
  UserRole
} from '@shared/types';

/**
 * Storage interface defining all data operations
 */
interface Storage {
  // Initialization
  initialize(): Promise<void>;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  // Contact operations
  getContacts(customerId?: string): Promise<Contact[]>;
  createContact(contact: Omit<Contact, 'id'>): Promise<Contact>;
  updateContact(id: string, updates: Partial<Contact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;

  // Communication operations
  getCommunications(contactId: number): Promise<Communication[]>;
  getCommunication(id: string): Promise<Communication | undefined>;
  createCommunication(communication: Omit<Communication, 'id' | 'createdAt'>): Promise<Communication>;
  updateCommunication(id: string, updates: Partial<Communication>): Promise<Communication>;
  deleteCommunication(id: string): Promise<void>;

  // Process operations
  getProcesses(customerId?: string): Promise<Process[]>;
  getProcess(id: string): Promise<Process | undefined>;
  createProcess(process: Omit<Process, 'id' | 'timeline'>): Promise<Process>;
  updateProcess(id: string, updates: Partial<Process>): Promise<Process>;
  deleteProcess(id: string): Promise<void>;
  
  // Team operations
  getTeams(customerId?: string): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: Omit<Team, 'id'> & { customerId: string }): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team>;
  deleteTeam(id: string): Promise<void>;
  
  // Service operations
  getServices(customerId?: string): Promise<Service[]>;
  createService(service: Omit<Service, 'id'> & { customerId: string }): Promise<Service>;
  
  // Document operations
  getDocuments(customerId?: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: Omit<Document, 'id'>): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  // Timeline operations
  getTimelineEvents(customerId?: string, processId?: string): Promise<TimelineEvent[]>;
  getTimelineEvent(id: string): Promise<TimelineEvent | undefined>;
  createTimelineEvent(event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent>;
  updateTimelineEvent(id: string, updates: Partial<TimelineEvent>): Promise<TimelineEvent>;
  deleteTimelineEvent(id: string): Promise<void>;
  
  // Chat operations
  getChatSessions(userId?: string): Promise<ChatSession[]>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  createChatSession(session: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatSession>;
  updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession>;
  deleteChatSession(id: string): Promise<void>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<any>;
  
  // Health check
  getHealthStatus(): Promise<{ status: string; message: string; timestamp: string }>;
}

/**
 * Supabase-based storage implementation
 */
class SupabaseStorage implements Storage {

  // Static in-memory storage for communications (persists across instances)
  private static inMemoryCommunications: Communication[] = [];
  private static nextCommunicationId = 1;
  
  async initialize(): Promise<void> {
    await databaseService.initialize();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    // For now return mock user - will implement with auth system
    return {
      id,
      email: 'user@example.com',
      name: 'Mock User',
      role: 'admin' as UserRole
    };
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return databaseService.customers.getAllCustomers();
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const customer = await databaseService.customers.getCustomerById(id);
    return customer || undefined;
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    return databaseService.customers.createCustomer(customer);
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    return databaseService.customers.updateCustomer(id, updates);
  }

  async deleteCustomer(id: string): Promise<void> {
    return databaseService.customers.deleteCustomer(id);
  }

  // Contact operations
  async getContacts(customerId?: string): Promise<Contact[]> {
    return databaseService.contacts.getAllContacts(customerId);
  }

  async createContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
    return databaseService.contacts.createContact(contact);
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    return databaseService.contacts.updateContact(id, updates);
  }

  async deleteContact(id: string): Promise<void> {
    return databaseService.contacts.deleteContact(id);
  }

  // Communication operations with static in-memory fallback
  async getCommunications(contactId: number): Promise<Communication[]> {
    console.log('SupabaseStorage.getCommunications called with contactId:', contactId);
    try {
      // Try to get from database first
      const communications = await databaseService.contacts.getCommunications(String(contactId));
      console.log('Database returned communications:', communications.length);
      return communications;
    } catch (error) {
      console.log('Database failed, using in-memory fallback for getCommunications:', error);
      // Fallback to static in-memory storage
      const filtered = SupabaseStorage.inMemoryCommunications.filter(c => c.contactId === contactId);
      console.log('In-memory fallback returned communications:', filtered.length);
      return filtered;
    }
  }

  async getCommunication(id: string): Promise<Communication | undefined> {
    console.log('SupabaseStorage.getCommunication called with id:', id);
    try {
      // Try to get from database first
      return await databaseService.contacts.getCommunication(id);
    } catch (error) {
      console.log('Database failed, using in-memory fallback for getCommunication:', error);
      // Fallback to static in-memory storage
      return SupabaseStorage.inMemoryCommunications.find(c => c.id === id);
    }
  }

  async createCommunication(communication: Omit<Communication, 'id' | 'createdAt'>): Promise<Communication> {
    console.log('SupabaseStorage.createCommunication called with:', communication);
    
    // Add createdAt timestamp
    const communicationWithTimestamp = {
      ...communication,
      createdAt: new Date().toISOString()
    };
    
    try {
      // Try to create in database first
      const result = await databaseService.contacts.createCommunication(communicationWithTimestamp);
      console.log('Database created communication:', result);
      return result;
    } catch (error) {
      console.log('Database failed, using in-memory fallback for createCommunication:', error);
      // Fallback to static in-memory storage
      const newCommunication: Communication = {
        id: String(SupabaseStorage.nextCommunicationId++),
        ...communicationWithTimestamp
      };
      SupabaseStorage.inMemoryCommunications.push(newCommunication);
      console.log('In-memory fallback created communication:', newCommunication);
      return newCommunication;
    }
  }

  async updateCommunication(id: string, updates: Partial<Communication>): Promise<Communication> {
    console.log('SupabaseStorage.updateCommunication called with id:', id, 'updates:', updates);
    try {
      // Try to update in database first
      return await databaseService.contacts.updateCommunication(id, updates);
    } catch (error) {
      console.log('Database failed, using in-memory fallback for updateCommunication:', error);
      // Fallback to static in-memory storage
      const index = SupabaseStorage.inMemoryCommunications.findIndex(c => c.id === id);
      if (index === -1) {
        throw new Error(`Communication with id ${id} not found`);
      }
      const updated = {
        ...SupabaseStorage.inMemoryCommunications[index],
        ...updates
      };
      SupabaseStorage.inMemoryCommunications[index] = updated;
      console.log('In-memory fallback updated communication:', updated);
      return updated;
    }
  }

  async deleteCommunication(id: string): Promise<void> {
    console.log('SupabaseStorage.deleteCommunication called with id:', id);
    try {
      // Try to delete from database first
      await databaseService.contacts.deleteCommunication(id);
      console.log('Database deleted communication');
    } catch (error) {
      console.log('Database failed, using in-memory fallback for deleteCommunication:', error);
      // Fallback to static in-memory storage
      const index = SupabaseStorage.inMemoryCommunications.findIndex(c => c.id === id);
      if (index !== -1) {
        SupabaseStorage.inMemoryCommunications.splice(index, 1);
        console.log('In-memory fallback deleted communication');
      }
    }
  }

  // Process operations
  async getProcesses(customerId?: string): Promise<Process[]> {
    if (customerId) {
      return databaseService.processes.getProcessesByCustomerId(customerId);
    }
    return databaseService.processes.getAllProcesses();
  }

  async getProcess(id: string): Promise<Process | undefined> {
    const process = await databaseService.processes.getProcessById(id);
    return process || undefined;
  }

  async createProcess(process: Omit<Process, 'id' | 'timeline'>): Promise<Process> {
    return databaseService.processes.createProcess(process);
  }

  async updateProcess(id: string, updates: Partial<Process>): Promise<Process> {
    return databaseService.processes.updateProcess(id, updates);
  }

  async deleteProcess(id: string): Promise<void> {
    return databaseService.processes.deleteProcess(id);
  }

  // Team operations
  async getTeams(customerId?: string): Promise<Team[]> {
    console.log("Supabase Storage.getTeams called with customerId:", customerId);
    
    if (customerId) {
      console.log("Filtering teams by customerId:", customerId);
      const teams = await databaseService.teams.getTeamsByCustomerId(customerId);
      console.log("Filtered teams result:", teams.length, "teams");
      return teams;
    }
    
    console.log("Getting all teams (no filter)");
    const allTeams = await databaseService.teams.getAllTeams();
    console.log("All teams result:", allTeams.length, "teams");
    return allTeams;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const team = await databaseService.teams.getTeamById(id);
    return team || undefined;
  }

  async createTeam(team: Omit<Team, 'id'> & { customerId: string }): Promise<Team> {
    return databaseService.teams.createTeam(team);
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    return databaseService.teams.updateTeam(id, updates);
  }

  async deleteTeam(id: string): Promise<void> {
    return databaseService.teams.deleteTeam(id);
  }

  // Service operations
  async getServices(customerId?: string): Promise<Service[]> {
    if (customerId) {
      return databaseService.services.getServicesByCustomerId(customerId);
    }
    return databaseService.services.getAllServices();
  }

  async createService(service: Omit<Service, 'id'> & { customerId: string }): Promise<Service> {
    return databaseService.services.createService(service);
  }

  // Document operations
  async getDocuments(customerId?: string): Promise<Document[]> {
    // For now return empty array - will implement document service
    return [];
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return undefined;
  }

  async createDocument(document: Omit<Document, 'id'>): Promise<Document> {
    return {
      id: crypto.randomUUID(),
      ...document
    };
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    throw new Error('Document update not implemented yet');
  }

  async deleteDocument(id: string): Promise<void> {
    // Mock implementation
  }

  // Timeline operations
  async getTimelineEvents(customerId?: string, processId?: string): Promise<TimelineEvent[]> {
    return [];
  }

  async getTimelineEvent(id: string): Promise<TimelineEvent | undefined> {
    return undefined;
  }

  async createTimelineEvent(event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> {
    return {
      id: crypto.randomUUID(),
      ...event
    };
  }

  async updateTimelineEvent(id: string, updates: Partial<TimelineEvent>): Promise<TimelineEvent> {
    throw new Error('Timeline event update not implemented yet');
  }

  async deleteTimelineEvent(id: string): Promise<void> {
    // Mock implementation
  }

  // Chat operations
  async getChatSessions(userId?: string): Promise<ChatSession[]> {
    return [];
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    return undefined;
  }

  async createChatSession(session: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatSession> {
    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...session
    };
  }

  async updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    throw new Error('Chat session update not implemented yet');
  }

  async deleteChatSession(id: string): Promise<void> {
    // Mock implementation
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return [];
  }

  async createChatMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
    return {
      id: crypto.randomUUID(),
      ...message
    };
  }

  // Dashboard operations
  async getDashboardMetrics(): Promise<any> {
    return databaseService.getDashboardMetrics();
  }

  async getHealthStatus(): Promise<{ status: string; message: string; timestamp: string }> {
    return databaseService.getHealthStatus();
  }
}

// Create and export storage instance
const storage = new SupabaseStorage();

export { storage };
