import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage_new.js";
import { setupAuth, isAuthenticated } from "./mockAuth.js";
import {
  insertCustomerSchema,
  insertContactSchema,
  insertTeamSchema,
  insertServiceSchema,
  insertProcessSchema,
  insertDocumentSchema,
  insertTimelineEventSchema,
  insertAiChatSessionSchema,
  insertAiChatMessageSchema,
  insertCommunicationSchema,
} from "./validation.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // In mock mode, use the session user directly
      const userId = req.session.user?.id || req.user?.id || 'demo-user-123';
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Customer routes
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Transform the data to match the Customer interface
      const customerData = {
        ...validatedData,
        contacts: validatedData.contacts?.map(contact => ({
          ...contact,
          customerId: '' // Will be set by the storage layer after customer creation
        })) || []
      };
      
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      
      // Transform the data to match the Customer interface
      const customerData = {
        ...validatedData,
        contacts: validatedData.contacts?.map(contact => ({
          ...contact,
          customerId: id // Use the customer ID from the route
        })) || undefined
      };
      
      const customer = await storage.updateCustomer(id, customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteCustomer(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Contact routes
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const contacts = await storage.getContacts(customerId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      
      // Ensure required fields are set with default values if not provided
      const contactWithDefaults = {
        ...contactData,
        title: contactData.title || "",
        email: contactData.email || "",
        phone: contactData.phone || "",
        role: contactData.role || ""
      };
      
      const contact = await storage.createContact(contactWithDefaults);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.put("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const contactData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, contactData);
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteContact(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }  });

  // Communication routes
  // Get communications for a specific contact
  app.get("/api/contacts/:id/communications", isAuthenticated, async (req, res) => {
    try {
      const contactId = req.params.id;
      const contactIdNumber = parseInt(contactId, 10);
      if (isNaN(contactIdNumber)) {
        return res.status(400).json({ message: "Contact ID must be a valid number" });
      }
      const communications = await storage.getCommunications(contactIdNumber);
      res.json(communications);
    } catch (error) {
      console.error("Error fetching communications for contact:", error);
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  app.get("/api/communications", isAuthenticated, async (req, res) => {
    try {
      const contactId = req.query.contactId as string;
      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }
      const contactIdNumber = parseInt(contactId, 10);
      if (isNaN(contactIdNumber)) {
        return res.status(400).json({ message: "Contact ID must be a valid number" });
      }
      const communications = await storage.getCommunications(contactIdNumber);
      res.json(communications);
    } catch (error) {
      console.error("Error fetching communications:", error);
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  app.post("/api/communications", isAuthenticated, async (req, res) => {
    try {
      const communicationData = insertCommunicationSchema.parse(req.body);
      const communication = await storage.createCommunication(communicationData);
      res.status(201).json(communication);
    } catch (error) {
      console.error("Error creating communication:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create communication" });
    }
  });

  // Get a single communication by ID
  app.get("/api/communications/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const communication = await storage.getCommunication(id);
      if (!communication) {
        return res.status(404).json({ message: "Communication not found" });
      }
      res.json(communication);
    } catch (error) {
      console.error("Error fetching communication:", error);
      res.status(500).json({ message: "Failed to fetch communication" });
    }
  });

  app.put("/api/communications/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const communicationData = insertCommunicationSchema.partial().parse(req.body);
      const communication = await storage.updateCommunication(id, communicationData);
      res.json(communication);
    } catch (error) {
      console.error("Error updating communication:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update communication" });
    }
  });

  app.delete("/api/communications/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteCommunication(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting communication:", error);
      res.status(500).json({ message: "Failed to delete communication" });
    }
  });

  // Team routes
  app.get("/api/teams", isAuthenticated, async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      console.log("Teams API called with customerId:", customerId);
      const teams = await storage.getTeams(customerId);
      console.log("Teams returned:", teams.length, "teams");
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams", isAuthenticated, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.put("/api/teams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const teamData = insertTeamSchema.partial().parse(req.body);
      const team = await storage.updateTeam(id, teamData);
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteTeam(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Service routes
  app.get("/api/services", isAuthenticated, async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const services = await storage.getServices(customerId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", isAuthenticated, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Process routes
  app.get("/api/processes", isAuthenticated, async (req, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const processes = await storage.getProcesses(customerId);
      res.json(processes);
    } catch (error) {
      console.error("Error fetching processes:", error);
      res.status(500).json({ message: "Failed to fetch processes" });
    }
  });

  app.post("/api/processes", isAuthenticated, async (req, res) => {
    try {
      const processData = insertProcessSchema.parse(req.body);
      const process = await storage.createProcess(processData);
      res.status(201).json(process);
    } catch (error) {
      console.error("Error creating process:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create process" });
    }
  });

  app.put("/api/processes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const processData = insertProcessSchema.partial().parse(req.body);
      const process = await storage.updateProcess(id, processData);
      res.json(process);
    } catch (error) {
      console.error("Error updating process:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update process" });
    }
  });

  // Document routes
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const documents = await storage.getDocuments(customerId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      
      // Add required uploadDate field
      const documentWithUploadDate = {
        ...documentData,
        uploadDate: new Date().toISOString()
      };
      
      const document = await storage.createDocument(documentWithUploadDate);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Timeline routes
  app.get("/api/timeline", isAuthenticated, async (req, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const processId = req.query.processId as string | undefined;
      
      // For unified timeline, get all events and enhance with related data
      const events = await storage.getTimelineEvents(customerId, processId);
      
      // Enhance events with customer and process information
      const [customers, processes] = await Promise.all([
        (await storage).getCustomers(),
        (await storage).getProcesses()
      ]);
      
      const enhancedEvents = events.map(event => {
        // Get customer and process info from metadata if available
        const customerId = event.metadata?.customerId || null;
        const processId = event.metadata?.processId || null;
        
        const customer = customerId ? customers.find(c => c.id.toString() === customerId.toString()) : null;
        const process = processId ? processes.find(p => p.id.toString() === processId.toString()) : null;
        
        return {
          ...event,
          customerName: customer?.name,
          processName: process?.name,
          entityType: event.metadata?.entityType || 'customer'
        };
      });
      
      res.json(enhancedEvents);
    } catch (error) {
      console.error("Error fetching timeline events:", error);
      res.status(500).json({ message: "Failed to fetch timeline events" });
    }
  });

  app.post("/api/timeline", isAuthenticated, async (req, res) => {
    try {
      const eventData = insertTimelineEventSchema.parse(req.body);
      
      // Ensure description is provided or set to empty string
      const timelineEventData = {
        ...eventData,
        description: eventData.description || ""
      };
      
      const event = await storage.createTimelineEvent(timelineEventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating timeline event:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create timeline event" });
      }
    }
  });

  // AI Chat routes
  app.get("/api/chat/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user?.id || req.user?.id || 'demo-user-123';
      const sessions = await storage.getChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.post("/api/chat/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user?.id || req.user?.id || 'demo-user-123';
      const sessionData = insertAiChatSessionSchema.parse({
        ...req.body,
        userId,
      });
      
      // Add the required messages property for ChatSession
      const chatSessionData = {
        ...sessionData,
        messages: []
      };
      
      const session = await storage.createChatSession(chatSessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.get("/api/chat/sessions/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.id;
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/sessions/:id/messages", isAuthenticated, async (req, res) => {
    try {
      console.log("📩 Received message request for session:", req.params.id);
      console.log("📄 Message data:", JSON.stringify(req.body));
      
      const sessionId = req.params.id;
      const messageData = insertAiChatMessageSchema.parse({
        ...req.body,
        sessionId,
        timestamp: new Date().toISOString() // Ensure timestamp is set
      });
      
      console.log("✅ Validation passed, creating message with data:", JSON.stringify(messageData));
      const message = await storage.createChatMessage(messageData);
      console.log("✅ Message created successfully:", message.id);
      
      res.status(201).json(message);
    } catch (error) {
      console.error("❌ Error creating chat message:", error);
      if (error instanceof z.ZodError) {
        console.error("❌ Validation errors:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  // AI Config endpoints
  app.get("/api/ai/config", isAuthenticated, async (req, res) => {
    try {
      // Import the AI chat config module
      const { getOllamaConfig } = await import('./lib/ai-chat/config.js');
      
      // Get the current configuration
      const config = getOllamaConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching AI configuration:", error);
      res.status(500).json({ message: "Failed to fetch AI configuration" });
    }
  });

  app.post("/api/ai/config", isAuthenticated, async (req, res) => {
    try {
      // Import the AI chat config module
      const { updateOllamaConfig } = await import('./lib/ai-chat/config.js');
      
      // Update the configuration
      await updateOllamaConfig(req.body);
      
      // Return the updated configuration
      const { getOllamaConfig } = await import('./lib/ai-chat/config.js');
      const config = getOllamaConfig();
      res.json(config);
    } catch (error) {
      console.error("Error updating AI configuration:", error);
      res.status(500).json({ message: "Failed to update AI configuration" });
    }
  });

  app.get("/api/ai/models", isAuthenticated, async (req, res) => {
    try {
      // Import the AI chat API module
      const { fetchAvailableModels } = await import('./lib/ai-chat/api.js');
      
      // Fetch available models
      const models = await fetchAvailableModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ message: "Failed to fetch AI models" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const health = await storage.getHealthStatus();
      res.json(health);
    } catch (error) {
      console.error("Error checking health:", error);
      res.status(500).json({ 
        status: 'unhealthy', 
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
