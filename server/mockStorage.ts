import type { IStorage } from "./storage";
import {
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
  type Communication,
  type InsertCommunication,
} from "@shared/schema";

export class MockStorage implements IStorage {
  private users: User[] = [
    {
      id: "user-1",
      email: "demo@salesdashboard.com",
      firstName: "Demo",
      lastName: "User",
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private customers: Customer[] = [
    {
      id: 1,
      name: "Acme Corporation",
      phase: "Steady State",      contractStartDate: "2024-01-01",
      contractEndDate: "2024-12-31",
      logoUrl: null,
      avatarColor: "#1976D2",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: "TechFlow Solutions",
      phase: "New Activation",      contractStartDate: "2024-03-15",
      contractEndDate: "2025-03-14",
      logoUrl: null,
      avatarColor: "#388E3C",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      name: "Global Innovations",
      phase: "Contracting",
      contractStartDate: null,
      contractEndDate: null,
      logoUrl: null,
      avatarColor: "#F57C00",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      name: "DataSync Corp",
      phase: "Steady State",      contractStartDate: "2023-06-01",
      contractEndDate: "2024-05-31",
      logoUrl: null,
      avatarColor: "#7B1FA2",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private contacts: Contact[] = [
    {
      id: 1,
      customerId: 1,
      name: "Alice Johnson",
      title: "CTO",
      email: "alice.johnson@acme.com",
      phone: "+1-555-0101",
      role: "Technical Lead",
      type: "Client",
      createdAt: new Date(),
    },
    {
      id: 2,
      customerId: 1,
      name: "Bob Smith",
      title: "Project Manager",
      email: "bob.smith@acme.com",
      phone: "+1-555-0102",
      role: "Project Management",
      type: "Client",
      createdAt: new Date(),
    },
    {
      id: 3,
      customerId: 2,
      name: "Carol Williams",
      title: "VP Engineering",
      email: "carol.williams@techflow.com",
      phone: "+1-555-0201",
      role: "Executive Sponsor",
      type: "Client",
      createdAt: new Date(),
    },
    {
      id: 4,
      customerId: 3,
      name: "David Brown",
      title: "Lead Developer",
      email: "david.brown@global.com",
      phone: "+1-555-0301",
      role: "Technical Lead",
      type: "Client",
      createdAt: new Date(),
    },
  ];
  private teams: Team[] = [
    {
      id: 1,
      name: "Development Team Alpha",
      financeCode: "DEV-ALPHA-001",
      customerId: 1,
      createdAt: new Date(),
    },
    {
      id: 2,
      name: "QA Team Beta",
      financeCode: "QA-BETA-002",
      customerId: 1,
      createdAt: new Date(),
    },
    {
      id: 3,
      name: "DevOps Team Gamma",
      financeCode: "DEVOPS-GAMMA-003",
      customerId: 1,
      createdAt: new Date(),
    },
  ];

  private services: Service[] = [
    {
      id: 1,
      customerId: 1,
      name: "Custom Software Development",
      monthlyHours: 120,
      createdAt: new Date(),
    },
    {
      id: 2,
      customerId: 1,
      name: "System Integration",
      monthlyHours: 80,
      createdAt: new Date(),
    },
    {
      id: 3,
      customerId: 2,
      name: "Platform Migration",
      monthlyHours: 160,
      createdAt: new Date(),
    },
    {
      id: 4,
      customerId: 4,
      name: "Data Analytics Platform",
      monthlyHours: 200,
      createdAt: new Date(),
    },
  ];

  private processes: Process[] = [
    {
      id: 1,
      name: "User Authentication System",
      customerId: 1,
      jiraTicket: "ACME-123",
      status: "In Progress",
      sdlcStage: "Development",      startDate: "2024-01-15",
      dueDate: "2024-03-15",
      approvalStatus: "Approved",
      estimate: 240,
      functionalArea: "Security",
      responsibleContactId: 1,
      progress: 65,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: "Payment Gateway Integration",
      customerId: 1,
      jiraTicket: "ACME-124",
      status: "Not Started",
      sdlcStage: "Requirements",      startDate: "2024-03-01",
      dueDate: "2024-05-01",
      approvalStatus: "Pending",
      estimate: 180,
      functionalArea: "Payments",
      responsibleContactId: 2,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      name: "Data Migration Tool",
      customerId: 2,
      jiraTicket: "TECH-456",
      status: "In Progress",
      sdlcStage: "Testing",      startDate: "2024-02-01",
      dueDate: "2024-04-01",
      approvalStatus: "Approved",
      estimate: 320,
      functionalArea: "Data Management",
      responsibleContactId: 3,
      progress: 85,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      name: "API Modernization",
      customerId: 4,
      jiraTicket: "DATA-789",
      status: "Completed",
      sdlcStage: "Deployment",      startDate: "2023-12-01",
      dueDate: "2024-02-01",
      approvalStatus: "Approved",
      estimate: 400,
      functionalArea: "Backend",
      responsibleContactId: 4,
      progress: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private documents: Document[] = [
    {
      id: 1,
      customerId: 1,
      name: "Project Requirements Document",
      description: "Detailed requirements for the authentication system",
      category: "Requirements",
      fileUrl: "/mock/documents/req-doc-1.pdf",
      fileSize: 2048000,
      mimeType: "application/pdf",
      uploadedAt: new Date(),
    },
    {
      id: 2,
      customerId: 1,
      name: "System Architecture Design",
      description: "High-level system architecture diagrams",
      category: "Design",
      fileUrl: "/mock/documents/arch-design-1.pdf",
      fileSize: 1536000,
      mimeType: "application/pdf",
      uploadedAt: new Date(),
    },
    {
      id: 3,
      customerId: 2,
      name: "Migration Strategy Document",
      description: "Step-by-step migration plan and timeline",
      category: "Technical",
      fileUrl: "/mock/documents/migration-strategy.pdf",
      fileSize: 3072000,
      mimeType: "application/pdf",
      uploadedAt: new Date(),
    },
  ];

  private timelineEvents: TimelineEvent[] = [
    {
      id: 1,
      customerId: 1,
      processId: 1,
      eventType: "process_started",
      title: "Authentication System Development Started",
      description: "Began development of the user authentication system",
      metadata: { jiraTicket: "ACME-123" },
      createdAt: new Date("2024-01-15"),
    },
    {
      id: 2,
      customerId: 1,
      processId: null,
      eventType: "customer_created",
      title: "Customer Onboarded",
      description: "Acme Corporation was successfully onboarded",
      metadata: null,
      createdAt: new Date("2024-01-01"),
    },
    {
      id: 3,
      customerId: 2,
      processId: 3,
      eventType: "process_started",
      title: "Data Migration Started",
      description: "Initiated data migration project for TechFlow Solutions",
      metadata: { jiraTicket: "TECH-456" },
      createdAt: new Date("2024-02-01"),
    },
  ];

  private aiChatSessions: AiChatSession[] = [
    {
      id: 1,
      userId: "user-1",
      title: "Project Planning Discussion",
      model: "llama2",
      systemPrompt: "You are a helpful project management assistant.",
      createdAt: new Date(),
    },
  ];

  private aiChatMessages: AiChatMessage[] = [
    {
      id: 1,
      sessionId: 1,
      role: "user",
      content: "What's the status of our current projects?",
      createdAt: new Date(),
    },
    {
      id: 2,
      sessionId: 1,
      role: "assistant",
      content: "Based on the current data, you have 4 active projects. The Authentication System is 65% complete, the Payment Gateway is in requirements phase, the Data Migration Tool is 85% complete and in testing, and the API Modernization project is completed.",
      createdAt: new Date(),
    },  ];

  private communications: Communication[] = [
    {
      id: 1,
      contactId: 1,
      type: "email",
      subject: "Project Kickoff Meeting",
      notes: "Discussed project timeline and initial requirements. Sarah confirmed team availability for the project kickoff meeting scheduled for next week.",
      date: "2024-01-15",
      createdAt: new Date("2024-01-15T10:30:00Z"),
    },
    {
      id: 2,
      contactId: 1,
      type: "phone",
      subject: "Technical Requirements Review",
      notes: "30-minute call to review the technical specifications. Clarified authentication requirements and discussed integration points.",
      date: "2024-01-18",
      createdAt: new Date("2024-01-18T14:15:00Z"),
    },
    {
      id: 3,
      contactId: 2,
      type: "meeting",
      subject: "Weekly Status Meeting",
      notes: "Attended the weekly status meeting. Discussed current sprint progress and upcoming deliverables. Mike provided updates on backend development.",
      date: "2024-01-22",
      createdAt: new Date("2024-01-22T09:00:00Z"),
    },
    {
      id: 4,
      contactId: 3,
      type: "email",
      subject: "Budget Approval Request",
      notes: "Sent detailed proposal for additional development resources. Waiting for executive approval on budget increase for Q2.",
      date: "2024-01-25",
      createdAt: new Date("2024-01-25T16:45:00Z"),
    },
    {
      id: 5,
      contactId: 1,
      type: "other",
      subject: "Slack Discussion",
      notes: "Quick discussion on Slack about deployment timeline. Agreed to move deployment date to allow for additional testing.",
      date: "2024-01-28",
      createdAt: new Date("2024-01-28T11:20:00Z"),
    },
  ];

  private nextId = 100; // Start high to avoid conflicts

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }
  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingIndex = this.users.findIndex(u => u.id === userData.id);
    const user: User = {
      id: userData.id,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      updatedAt: new Date(),
      createdAt: existingIndex >= 0 ? this.users[existingIndex].createdAt : new Date(),
    };

    if (existingIndex >= 0) {
      this.users[existingIndex] = user;
    } else {
      this.users.push(user);
    }

    return user;
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return [...this.customers].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.find(c => c.id === id);
  }
  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const customer: Customer = {
      id: this.nextId++,
      name: customerData.name,
      phase: customerData.phase,
      contractStartDate: customerData.contractStartDate ?? null,
      contractEndDate: customerData.contractEndDate ?? null,
      logoUrl: customerData.logoUrl ?? null,
      avatarColor: customerData.avatarColor ?? "#3B82F6",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.customers.push(customer);

    // Create timeline event
    await this.createTimelineEvent({
      customerId: customer.id,
      eventType: "customer_created",
      title: "Customer Created",
      description: `Customer ${customer.name} was created`,
    });

    return customer;
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Customer not found");

    this.customers[index] = {
      ...this.customers[index],
      ...customerData,
      updatedAt: new Date(),
    };

    return this.customers[index];
  }

  async deleteCustomer(id: number): Promise<void> {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Customer not found");
    this.customers.splice(index, 1);

    // Clean up related data
    this.contacts = this.contacts.filter(c => c.customerId !== id);
    this.services = this.services.filter(s => s.customerId !== id);
    this.processes = this.processes.filter(p => p.customerId !== id);
    this.documents = this.documents.filter(d => d.customerId !== id);
    this.timelineEvents = this.timelineEvents.filter(t => t.customerId !== id);
  }

  // Contact operations
  async getContacts(customerId?: number): Promise<Contact[]> {
    if (customerId) {
      return this.contacts.filter(c => c.customerId === customerId);
    }
    return [...this.contacts];
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.find(c => c.id === id);
  }
  async createContact(contactData: InsertContact): Promise<Contact> {
    const contact: Contact = {
      id: this.nextId++,
      name: contactData.name,
      email: contactData.email,
      title: contactData.title ?? null,
      role: contactData.role ?? null,
      phone: contactData.phone ?? null,
      type: contactData.type,
      customerId: contactData.customerId,
      createdAt: new Date(),
    };

    this.contacts.push(contact);
    return contact;
  }

  async updateContact(id: number, contactData: Partial<InsertContact>): Promise<Contact> {
    const index = this.contacts.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Contact not found");

    this.contacts[index] = {
      ...this.contacts[index],
      ...contactData,
    };

    return this.contacts[index];
  }

  async deleteContact(id: number): Promise<void> {
    const index = this.contacts.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Contact not found");
    this.contacts.splice(index, 1);
  }  // Team operations
  async getTeams(customerId?: string): Promise<Team[]> {
    // Note: MockStorage teams are not currently filtered by customer
    // This would need to be implemented if mock data includes customer relationships
    return [...this.teams];
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.find(t => t.id === id);
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const team: Team = {
      ...teamData,
      id: this.nextId++,
      createdAt: new Date(),
    };

    this.teams.push(team);
    return team;
  }

  async updateTeam(id: number, teamData: Partial<InsertTeam>): Promise<Team> {
    const index = this.teams.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Team not found");

    this.teams[index] = {
      ...this.teams[index],
      ...teamData,
    };

    return this.teams[index];
  }

  async deleteTeam(id: number): Promise<void> {
    const index = this.teams.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Team not found");
    this.teams.splice(index, 1);
  }

  // Service operations
  async getServices(customerId?: number): Promise<Service[]> {
    if (customerId) {
      return this.services.filter(s => s.customerId === customerId);
    }
    return [...this.services];
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.find(s => s.id === id);
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const service: Service = {
      ...serviceData,
      id: this.nextId++,
      createdAt: new Date(),
    };

    this.services.push(service);
    return service;
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service> {
    const index = this.services.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Service not found");

    this.services[index] = {
      ...this.services[index],
      ...serviceData,
    };

    return this.services[index];
  }

  async deleteService(id: number): Promise<void> {
    const index = this.services.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Service not found");
    this.services.splice(index, 1);
  }

  // Process operations
  async getProcesses(customerId?: number): Promise<Process[]> {
    if (customerId) {
      return this.processes.filter(p => p.customerId === customerId);
    }
    return [...this.processes];
  }

  async getProcess(id: number): Promise<Process | undefined> {
    return this.processes.find(p => p.id === id);
  }  async createProcess(processData: InsertProcess): Promise<Process> {
    const process: Process = {
      id: this.nextId++,
      name: processData.name,
      status: processData.status,
      customerId: processData.customerId,
      jiraTicket: processData.jiraTicket ?? null,
      sdlcStage: processData.sdlcStage,
      startDate: processData.startDate,
      dueDate: processData.dueDate ?? null,
      approvalStatus: processData.approvalStatus ?? "Pending",
      estimate: processData.estimate ?? null,
      functionalArea: processData.functionalArea ?? null,
      responsibleContactId: processData.responsibleContactId ?? null,
      progress: processData.progress ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.processes.push(process);

    // Create timeline event
    await this.createTimelineEvent({
      customerId: process.customerId,
      processId: process.id,
      eventType: "process_started",
      title: "Process Started",
      description: `Process ${process.name} was started`,
      metadata: { jiraTicket: process.jiraTicket },
    });

    return process;
  }

  async updateProcess(id: number, processData: Partial<InsertProcess>): Promise<Process> {
    const index = this.processes.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Process not found");

    this.processes[index] = {
      ...this.processes[index],
      ...processData,
      updatedAt: new Date(),
    };

    return this.processes[index];
  }

  async deleteProcess(id: number): Promise<void> {
    const index = this.processes.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Process not found");
    this.processes.splice(index, 1);

    // Clean up related timeline events
    this.timelineEvents = this.timelineEvents.filter(t => t.processId !== id);
  }

  // Document operations
  async getDocuments(customerId?: number): Promise<Document[]> {
    if (customerId) {
      return this.documents.filter(d => d.customerId === customerId);
    }
    return [...this.documents];
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.find(d => d.id === id);
  }
  async createDocument(documentData: InsertDocument): Promise<Document> {
    const document: Document = {
      id: this.nextId++,
      name: documentData.name,
      customerId: documentData.customerId,
      description: documentData.description ?? null,
      category: documentData.category,
      fileUrl: documentData.fileUrl,
      fileSize: documentData.fileSize ?? null,
      mimeType: documentData.mimeType ?? null,
      uploadedAt: new Date(),
    };

    this.documents.push(document);

    // Create timeline event
    await this.createTimelineEvent({
      customerId: document.customerId,
      eventType: "document_uploaded",
      title: "Document Uploaded",
      description: `Document ${document.name} was uploaded`,
      metadata: { documentId: document.id, category: document.category },
    });

    return document;
  }

  async updateDocument(id: number, documentData: Partial<InsertDocument>): Promise<Document> {
    const index = this.documents.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Document not found");

    this.documents[index] = {
      ...this.documents[index],
      ...documentData,
    };

    return this.documents[index];
  }

  async deleteDocument(id: number): Promise<void> {
    const index = this.documents.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Document not found");
    this.documents.splice(index, 1);
  }

  // Timeline event operations
  async getTimelineEvents(customerId?: number, processId?: number): Promise<TimelineEvent[]> {
    let events = [...this.timelineEvents];

    if (customerId) {
      events = events.filter(e => e.customerId === customerId);
    }

    if (processId) {
      events = events.filter(e => e.processId === processId);
    }

    return events.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  async createTimelineEvent(eventData: InsertTimelineEvent): Promise<TimelineEvent> {
    const event: TimelineEvent = {
      id: this.nextId++,
      customerId: eventData.customerId ?? null,
      processId: eventData.processId ?? null,
      eventType: eventData.eventType,
      title: eventData.title,
      description: eventData.description ?? null,
      metadata: eventData.metadata ?? null,
      createdAt: new Date(),
    };

    this.timelineEvents.push(event);
    return event;
  }

  // AI Chat operations
  async getChatSessions(userId: string): Promise<AiChatSession[]> {
    return this.aiChatSessions
      .filter(s => s.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getChatSession(id: number): Promise<AiChatSession | undefined> {
    return this.aiChatSessions.find(s => s.id === id);
  }
  async createChatSession(sessionData: InsertAiChatSession): Promise<AiChatSession> {
    const session: AiChatSession = {
      id: this.nextId++,
      userId: sessionData.userId,
      title: sessionData.title ?? null,
      model: sessionData.model ?? "llama2",
      systemPrompt: sessionData.systemPrompt ?? null,
      createdAt: new Date(),
    };

    this.aiChatSessions.push(session);
    return session;
  }

  async getChatMessages(sessionId: number): Promise<AiChatMessage[]> {
    return this.aiChatMessages
      .filter(m => m.sessionId === sessionId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }
  async createChatMessage(messageData: InsertAiChatMessage): Promise<AiChatMessage> {
    const message: AiChatMessage = {
      ...messageData,
      id: this.nextId++,
      createdAt: new Date(),
    };

    this.aiChatMessages.push(message);
    return message;
  }

  // Communication operations
  async getCommunications(contactId: number): Promise<Communication[]> {
    return this.communications
      .filter(c => c.contactId === contactId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getCommunication(id: number): Promise<Communication | undefined> {
    return this.communications.find(c => c.id === id);
  }

  async createCommunication(communicationData: InsertCommunication): Promise<Communication> {
    const communication: Communication = {
      ...communicationData,
      id: this.nextId++,
      createdAt: new Date(),
    };

    this.communications.push(communication);
    return communication;
  }

  async updateCommunication(id: number, communicationData: Partial<InsertCommunication>): Promise<Communication> {
    const index = this.communications.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Communication with id ${id} not found`);
    }

    this.communications[index] = {
      ...this.communications[index],
      ...communicationData,
    };

    return this.communications[index];
  }

  async deleteCommunication(id: number): Promise<void> {
    const index = this.communications.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Communication with id ${id} not found`);
    }

    this.communications.splice(index, 1);
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    totalCustomers: number;
    activeProcesses: number;
    totalTeams: number;
    totalDocuments: number;
  }> {
    return {
      totalCustomers: this.customers.length,
      activeProcesses: this.processes.filter(p => p.status === "In Progress").length,
      totalTeams: this.teams.length,
      totalDocuments: this.documents.length,
    };
  }
}
