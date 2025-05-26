import {
  users,
  customers,
  contacts,
  teams,
  services,
  processes,
  documents,
  timelineEvents,
  aiChatSessions,
  aiChatMessages,
  type User,
  type UpsertUser,
  type Customer,
  type InsertCustomer,
  type Contact,
  type InsertContact,
  type Team,
  type InsertTeam,
  type Service,
  type InsertService,
  type Process,
  type InsertProcess,
  type Document,
  type InsertDocument,
  type TimelineEvent,
  type InsertTimelineEvent,
  type AiChatSession,
  type InsertAiChatSession,
  type AiChatMessage,
  type InsertAiChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;

  // Contact operations
  getContacts(customerId?: number): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;

  // Team operations
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;

  // Service operations
  getServices(customerId?: number): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Process operations
  getProcesses(customerId?: number): Promise<Process[]>;
  getProcess(id: number): Promise<Process | undefined>;
  createProcess(process: InsertProcess): Promise<Process>;
  updateProcess(id: number, process: Partial<InsertProcess>): Promise<Process>;
  deleteProcess(id: number): Promise<void>;

  // Document operations
  getDocuments(customerId?: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Timeline event operations
  getTimelineEvents(customerId?: number, processId?: number): Promise<TimelineEvent[]>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;

  // AI Chat operations
  getChatSessions(userId: string): Promise<AiChatSession[]>;
  getChatSession(id: number): Promise<AiChatSession | undefined>;
  createChatSession(session: InsertAiChatSession): Promise<AiChatSession>;
  getChatMessages(sessionId: number): Promise<AiChatMessage[]>;
  createChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalCustomers: number;
    activeProcesses: number;
    totalTeams: number;
    totalDocuments: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    
    // Create timeline event
    await this.createTimelineEvent({
      customerId: newCustomer.id,
      eventType: "customer_created",
      title: "Customer Created",
      description: `Customer ${newCustomer.name} was created`,
    });
    
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Contact operations
  async getContacts(customerId?: number): Promise<Contact[]> {
    if (customerId) {
      return await db.select().from(contacts).where(eq(contacts.customerId, customerId));
    }
    return await db.select().from(contacts);
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    
    // Create timeline event
    await this.createTimelineEvent({
      customerId: newContact.customerId,
      eventType: "contact_added",
      title: "Contact Added",
      description: `Contact ${newContact.name} was added`,
    });
    
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact> {
    const [updatedContact] = await db
      .update(contacts)
      .set(contact)
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Team operations
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(desc(teams.createdAt));
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const [updatedTeam] = await db
      .update(teams)
      .set(team)
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Service operations
  async getServices(customerId?: number): Promise<Service[]> {
    if (customerId) {
      return await db.select().from(services).where(eq(services.customerId, customerId));
    }
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Process operations
  async getProcesses(customerId?: number): Promise<Process[]> {
    if (customerId) {
      return await db.select().from(processes).where(eq(processes.customerId, customerId));
    }
    return await db.select().from(processes).orderBy(desc(processes.createdAt));
  }

  async getProcess(id: number): Promise<Process | undefined> {
    const [process] = await db.select().from(processes).where(eq(processes.id, id));
    return process;
  }

  async createProcess(process: InsertProcess): Promise<Process> {
    const [newProcess] = await db.insert(processes).values(process).returning();
    
    // Create timeline event
    await this.createTimelineEvent({
      customerId: newProcess.customerId,
      processId: newProcess.id,
      eventType: "process_created",
      title: "Process Created",
      description: `Process ${newProcess.name} was created`,
    });
    
    return newProcess;
  }

  async updateProcess(id: number, process: Partial<InsertProcess>): Promise<Process> {
    const [updatedProcess] = await db
      .update(processes)
      .set({ ...process, updatedAt: new Date() })
      .where(eq(processes.id, id))
      .returning();
    return updatedProcess;
  }

  async deleteProcess(id: number): Promise<void> {
    await db.delete(processes).where(eq(processes.id, id));
  }

  // Document operations
  async getDocuments(customerId?: number): Promise<Document[]> {
    if (customerId) {
      return await db.select().from(documents).where(eq(documents.customerId, customerId));
    }
    return await db.select().from(documents).orderBy(desc(documents.uploadedAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    
    // Create timeline event
    await this.createTimelineEvent({
      customerId: newDocument.customerId,
      eventType: "document_uploaded",
      title: "Document Uploaded",
      description: `Document ${newDocument.name} was uploaded`,
    });
    
    return newDocument;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Timeline event operations
  async getTimelineEvents(customerId?: number, processId?: number): Promise<TimelineEvent[]> {
    let query = db.select().from(timelineEvents);
    
    if (customerId && processId) {
      query = query.where(and(eq(timelineEvents.customerId, customerId), eq(timelineEvents.processId, processId)));
    } else if (customerId) {
      query = query.where(eq(timelineEvents.customerId, customerId));
    } else if (processId) {
      query = query.where(eq(timelineEvents.processId, processId));
    }
    
    return await query.orderBy(desc(timelineEvents.createdAt));
  }

  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    const [newEvent] = await db.insert(timelineEvents).values(event).returning();
    return newEvent;
  }

  // AI Chat operations
  async getChatSessions(userId: string): Promise<AiChatSession[]> {
    return await db.select().from(aiChatSessions)
      .where(eq(aiChatSessions.userId, userId))
      .orderBy(desc(aiChatSessions.createdAt));
  }

  async getChatSession(id: number): Promise<AiChatSession | undefined> {
    const [session] = await db.select().from(aiChatSessions).where(eq(aiChatSessions.id, id));
    return session;
  }

  async createChatSession(session: InsertAiChatSession): Promise<AiChatSession> {
    const [newSession] = await db.insert(aiChatSessions).values(session).returning();
    return newSession;
  }

  async getChatMessages(sessionId: number): Promise<AiChatMessage[]> {
    return await db.select().from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, sessionId))
      .orderBy(aiChatMessages.createdAt);
  }

  async createChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage> {
    const [newMessage] = await db.insert(aiChatMessages).values(message).returning();
    return newMessage;
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    totalCustomers: number;
    activeProcesses: number;
    totalTeams: number;
    totalDocuments: number;
  }> {
    const [customersCount] = await db.select({ count: count() }).from(customers);
    const [activeProcessesCount] = await db.select({ count: count() }).from(processes)
      .where(or(eq(processes.status, "In Progress"), eq(processes.status, "Not Started")));
    const [teamsCount] = await db.select({ count: count() }).from(teams);
    const [documentsCount] = await db.select({ count: count() }).from(documents);

    return {
      totalCustomers: customersCount.count,
      activeProcesses: activeProcessesCount.count,
      totalTeams: teamsCount.count,
      totalDocuments: documentsCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
