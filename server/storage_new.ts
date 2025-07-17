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
  ProcessTimelineEvent,
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
  getCustomers(includeInactive?: boolean): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  reactivateCustomer(id: string): Promise<Customer>;
  
  // Contact operations
  getContacts(customerId?: string): Promise<Contact[]>;
  createContact(contact: Omit<Contact, 'id'>): Promise<Contact>;
  updateContact(id: string, updates: Partial<Contact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
  // Internal contact assignment operations
  getInternalContacts(): Promise<Contact[]>;
  getContactAssignments(contactId: string): Promise<string[]>;
  assignContactToCustomer(contactId: string, customerId: string): Promise<void>;
  unassignContactFromCustomer(contactId: string, customerId: string): Promise<void>;
  // Communication operations
  getCommunications(contactId: string): Promise<Communication[]>;
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
  updateService(id: string, updates: Partial<Service>): Promise<Service>;
  deleteService(id: string): Promise<void>;
    // Document operations
  getDocuments(customerId?: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: Omit<Document, 'id'>): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
    // Process document operations
  getDocumentsByProcessId(processId: string): Promise<Document[]>;
  attachDocumentToProcess(processId: string, documentId: string): Promise<void>;
  removeDocumentFromProcess(processId: string, documentId: string): Promise<void>;
  createDocumentForProcess(processId: string, document: Omit<Document, 'id'> & { customerId: string }): Promise<Document>;
  getAvailableDocumentsForProcess(processId: string, customerId: string): Promise<Document[]>;
  
  // Process timeline operations
  createProcessTimelineEvent(event: { processId: string; stage: string; description: string; date: string }): Promise<ProcessTimelineEvent>;
  
  // Chat operations
  getChatSessions(userId?: string): Promise<ChatSession[]>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  createChatSession(session: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatSession>;
  updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession>;
  deleteChatSession(id: string): Promise<void>;  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: Omit<ChatMessage, 'id'> & { sessionId: string }): Promise<ChatMessage>;

  // Health check
  getHealthStatus(): Promise<{ status: string; message: string; timestamp: string }>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<any>;
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
  async getCustomers(includeInactive: boolean = false): Promise<Customer[]> {
    return databaseService.customers.getAllCustomers(includeInactive);
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

  async reactivateCustomer(id: string): Promise<Customer> {
    return databaseService.customers.reactivateCustomer(id);
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

  // Internal contact assignment operations
  async getInternalContacts(): Promise<Contact[]> {
    return databaseService.contacts.getInternalContacts();
  }

  async getContactAssignments(contactId: string): Promise<string[]> {
    return databaseService.contacts.getContactAssignments(contactId);
  }

  async assignContactToCustomer(contactId: string, customerId: string): Promise<void> {
    return databaseService.contacts.assignContactToCustomer(contactId, customerId);
  }

  async unassignContactFromCustomer(contactId: string, customerId: string): Promise<void> {
    return databaseService.contacts.unassignContactFromCustomer(contactId, customerId);
  }

  // Communication operations with static in-memory fallback
  async getCommunications(contactId: string): Promise<Communication[]> {
    console.log('SupabaseStorage.getCommunications called with contactId:', contactId);
    try {
      // Try to get from database first
      const communications = await databaseService.contacts.getCommunications(contactId);
      console.log('Database returned communications:', communications.length);
      return communications;    } catch (error) {
      console.log('Database failed, using in-memory fallback for getCommunications:', error);
      console.log('Current in-memory communications count:', SupabaseStorage.inMemoryCommunications.length);
      console.log('Looking for contactId:', contactId, 'type:', typeof contactId);
      
      // Debug: Log all stored communications
      SupabaseStorage.inMemoryCommunications.forEach((comm, index) => {
        console.log(`  [${index}] ID: ${comm.id}, ContactId: ${comm.contactId} (type: ${typeof comm.contactId}), Subject: ${comm.subject}`);
      });
      
      // Fallback to static in-memory storage - handle both string UUIDs and numeric IDs
      const contactIdNum = parseInt(contactId, 10);
      if (isNaN(contactIdNum)) {
        // Handle UUID strings by exact string match
        console.log('Filtering for UUID string:', contactId);
        const filtered = SupabaseStorage.inMemoryCommunications.filter(c => {
          const match = String(c.contactId) === contactId;
          console.log(`  Comparing "${String(c.contactId)}" === "${contactId}" -> ${match}`);
          return match;
        });
        console.log('In-memory fallback returned communications (UUID):', filtered.length);
        return filtered;
      }
      // Handle numeric IDs
      console.log('Filtering for numeric ID:', contactIdNum);
      const filtered = SupabaseStorage.inMemoryCommunications.filter(c => {
        const commContactIdNum = parseInt(c.contactId, 10);
        const match = commContactIdNum === contactIdNum;
        console.log(`  Comparing ${commContactIdNum} === ${contactIdNum} -> ${match}`);
        return match;
      });
      console.log('In-memory fallback returned communications (numeric):', filtered.length);
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

  async updateService(id: string, updates: Partial<Service>): Promise<Service> {
    return databaseService.services.updateService(id, updates);
  }

  async deleteService(id: string): Promise<void> {
    return databaseService.services.deleteService(id);
  }  // Document operations
  async getDocuments(customerId?: string): Promise<Document[]> {
    console.log('SupabaseStorage.getDocuments called with customerId:', customerId);
    if (customerId) {
      return databaseService.documents.getDocumentsByCustomerIdWithProcessInfo(customerId);
    }
    return databaseService.documents.getAllDocumentsWithProcessInfo();
  }
  async getDocument(id: string): Promise<Document | undefined> {
    console.log('SupabaseStorage.getDocument called with id:', id);
    const document = await databaseService.documents.getDocumentById(id);
    return document || undefined;
  }

  async createDocument(document: Omit<Document, 'id'>): Promise<Document> {
    return databaseService.documents.createDocument(document);
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    return databaseService.documents.updateDocument(id, updates);
  }

  async deleteDocument(id: string): Promise<void> {
    return databaseService.documents.deleteDocument(id);
  }

  async getDocumentsByProcessId(processId: string): Promise<Document[]> {
    return databaseService.documents.getDocumentsByProcessId(processId);
  }

  async getAvailableDocumentsForProcess(processId: string, customerId: string): Promise<Document[]> {
    return databaseService.documents.getAvailableDocumentsForProcess(processId, customerId);
  }

  async attachDocumentToProcess(processId: string, documentId: string): Promise<void> {
    return databaseService.documents.attachDocumentToProcess(processId, documentId);
  }

  async removeDocumentFromProcess(processId: string, documentId: string): Promise<void> {
    return databaseService.documents.removeDocumentFromProcess(processId, documentId);
  }

  async createDocumentForProcess(processId: string, document: Omit<Document, 'id'> & { customerId: string }): Promise<Document> {
    return databaseService.documents.createDocumentForProcess(processId, document);
  }

  async createProcessTimelineEvent(event: { processId: string; stage: string; description: string; date: string }): Promise<ProcessTimelineEvent> {
    return databaseService.processes.createProcessTimelineEvent(event);
  }

  // Chat operations
  async getChatSessions(userId?: string): Promise<ChatSession[]> {
    return databaseService.chat.getChatSessions(userId);
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const session = await databaseService.chat.getChatSession(id);
    return session || undefined;
  }

  async createChatSession(session: Omit<ChatSession, 'id'>): Promise<ChatSession> {
    return databaseService.chat.createChatSession(session);
  }

  async updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    return databaseService.chat.updateChatSession(id, updates);
  }

  async deleteChatSession(id: string): Promise<void> {
    return databaseService.chat.deleteChatSession(id);
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return databaseService.chat.getChatMessages(sessionId);
  }
  async createChatMessage(message: Omit<ChatMessage, 'id'> & { sessionId: string }): Promise<ChatMessage> {
    return databaseService.chat.createChatMessage({
      ...message,
      sessionId: message.sessionId
    });
  }

  async updateChatMessage(id: string, updates: Partial<ChatMessage>): Promise<ChatMessage> {
    return databaseService.chat.updateChatMessage(id, updates);
  }

  async deleteChatMessage(id: string): Promise<void> {
    return databaseService.chat.deleteChatMessage(id);
  }

  // Health check
  async getHealthStatus(): Promise<{ status: string; message: string; timestamp: string }> {
    try {
      // Test database connectivity
      await databaseService.users.getUserById('health-check');
      return {
        status: 'healthy',
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  // Dashboard metrics
  async getDashboardMetrics(): Promise<any> {
    return databaseService.getDashboardMetrics();
  }
}

export const storage = new SupabaseStorage();
