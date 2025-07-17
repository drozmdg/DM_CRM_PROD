import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage_new.js";
import authRoutes from "./routes/auth.js";
import { authenticateUser, requireAuth, requireAdmin } from "./middleware/auth.js";
import { noteService } from "./lib/database/noteService.js";
import { taskService } from "./lib/database/taskService.js";
import { teamService } from "./lib/database/teamService.js";
import { fileTransferService } from "./lib/database/fileTransferService.js";
import { notificationService } from "./lib/database/notificationService.js";
import { productService } from "./lib/database/productService.js";
import { reportService } from "./lib/database/reportService.js";
import { simplePdfService } from "./lib/simplePdfService.js";
import {
  insertCustomerSchema,
  insertContactSchema,
  insertTeamSchema,
  insertServiceSchema,
  insertProcessSchema,
  updateProcessSchema,
  insertDocumentSchema,
  insertProcessTimelineEventSchema,
  insertAiChatSessionSchema,
  insertAiChatMessageSchema,
  insertCommunicationSchema,
  insertCustomerNoteSchema,
  insertImportantDateSchema,
  updateCustomerNoteSchema,
  updateImportantDateSchema,
  insertProcessTaskSchema,
  updateProcessTaskSchema,
  insertProcessMilestoneSchema,
  updateProcessMilestoneSchema,
  insertFileTransferSchema,
  updateFileTransferSchema,
  insertNotificationSchema,
  updateNotificationSchema,
  insertProductSchema,
  updateProductSchema,
  assignTeamToProductSchema,
} from "./validation.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply global authentication middleware (optional auth)
  app.use('/api', authenticateUser);
  
  // Authentication routes (no auth required)
  app.use('/api/auth', authRoutes);
  
  // Dashboard metrics (require authentication)
  app.get("/api/dashboard/metrics", requireAuth, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Legacy dashboard route for backwards compatibility
  app.get("/api/dashboard/metrics-legacy", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });
  // Customer routes - dual auth (both new and legacy)
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const customers = await storage.getCustomers(includeInactive);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
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
  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      // Transform the data to match the Customer interface
      const customerData = {
        ...validatedData,
        active: true, // Set new customers as active by default
        contacts: validatedData.contacts?.map(contact => ({
          ...contact,
          customerId: '' // Will be set by the storage layer after customer creation
        })) || [],
        services: validatedData.services?.map(service => ({
          ...service,
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

  app.put("/api/customers/:id", async (req, res) => {
    try {      const id = req.params.id;
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      
      // Transform the data to match the Customer interface
      const customerData = {
        ...validatedData,
        contacts: validatedData.contacts?.map(contact => ({
          ...contact,
          customerId: id // Use the customer ID from the route
        })) || undefined,
        services: validatedData.services?.map(service => ({
          ...service,
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
  });  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`DELETE /api/customers/${id} called`);
      await storage.deleteCustomer(id);
      console.log(`Customer ${id} soft deleted successfully`);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Reactivate a customer (restore from soft delete)
  app.patch("/api/customers/:id/reactivate", async (req, res) => {
    try {
      const id = req.params.id;
      const customer = await storage.reactivateCustomer(id);
      res.json(customer);
    } catch (error) {
      console.error("Error reactivating customer:", error);
      res.status(500).json({ message: "Failed to reactivate customer" });
    }
  });

  // Customer Report routes
  app.get("/api/customers/:id/report-data", async (req, res) => {
    try {
      const customerId = req.params.id;
      console.log(`📊 Generating report data for customer: ${customerId}`);
      
      const reportData = await reportService.getCustomerReportData(customerId);
      res.json(reportData);
    } catch (error) {
      console.error("Error generating report data:", error);
      res.status(500).json({ message: "Failed to generate report data" });
    }
  });


  // Contact routes
  app.get("/api/contacts", async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const contacts = await storage.getContacts(customerId);
      console.log("API: /api/contacts returned", contacts.length, "contacts");
      if (contacts.length > 0) {
        const internalCount = contacts.filter(c => c.type === 'Internal').length;
        console.log("API: Found", internalCount, "Internal type contacts in regular contacts");
      }
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
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

  app.put("/api/contacts/:id", async (req, res) => {
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

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteContact(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }  });

  // Debug endpoint to check all contact types
  app.get("/api/contacts/debug", async (req, res) => {
    try {
      console.log("DEBUG: /api/contacts/debug called");
      const allContacts = await storage.getContacts(); // Get all contacts
      console.log("DEBUG: Total contacts in database:", allContacts.length);
      
      // Group by type
      const byType = allContacts.reduce((acc, contact) => {
        acc[contact.type] = (acc[contact.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log("DEBUG: Contacts by type:", byType);
      
      // Find internal contacts specifically
      const internalContacts = allContacts.filter(c => c.type === 'Internal');
      console.log("DEBUG: Internal contacts found:", internalContacts.length);
      internalContacts.forEach(c => console.log(`  - ${c.name} (ID: ${c.id}, Customer: ${c.customerId})`));
      
      res.json({
        total: allContacts.length,
        byType,
        internalContacts: internalContacts.map(c => ({ 
          id: c.id, 
          name: c.name, 
          type: c.type, 
          customerId: c.customerId 
        }))
      });
    } catch (error) {
      console.error("DEBUG: Error in debug endpoint:", error);
      res.status(500).json({ message: "Debug failed", error: error.message });
    }
  });

  // Internal Contact Assignment routes
  app.get("/api/contacts/internal", async (req, res) => {
    try {
      console.log("API: /api/contacts/internal called");
      const contacts = await storage.getInternalContacts();
      console.log("API: getInternalContacts returned", contacts.length, "contacts");
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching internal contacts:", error);
      res.status(500).json({ message: "Failed to fetch internal contacts" });
    }
  });

  app.get("/api/contacts/:contactId/assignments", async (req, res) => {
    try {
      const contactId = req.params.contactId;
      const assignments = await storage.getContactAssignments(contactId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching contact assignments:", error);
      res.status(500).json({ message: "Failed to fetch contact assignments" });
    }
  });

  app.post("/api/contacts/:contactId/assign/:customerId", async (req, res) => {
    try {
      const { contactId, customerId } = req.params;
      await storage.assignContactToCustomer(contactId, customerId);
      res.status(201).json({ message: "Contact assigned successfully" });
    } catch (error) {
      console.error("Error assigning contact to customer:", error);
      res.status(500).json({ message: "Failed to assign contact to customer" });
    }
  });

  app.delete("/api/contacts/:contactId/assign/:customerId", async (req, res) => {
    try {
      const { contactId, customerId } = req.params;
      await storage.unassignContactFromCustomer(contactId, customerId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unassigning contact from customer:", error);
      res.status(500).json({ message: "Failed to unassign contact from customer" });
    }
  });

  // Communication routes
  // Get communications for a specific contact
  app.get("/api/contacts/:id/communications", async (req, res) => {
    try {
      const contactId = req.params.id;
      const communications = await storage.getCommunications(contactId);
      res.json(communications);
    } catch (error) {
      console.error("Error fetching communications for contact:", error);
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });
  app.get("/api/communications", async (req, res) => {
    try {
      const contactId = req.query.contactId as string;
      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }
      const communications = await storage.getCommunications(contactId);
      res.json(communications);
    } catch (error) {
      console.error("Error fetching communications:", error);
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  app.post("/api/communications", async (req, res) => {
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
  app.get("/api/communications/:id", async (req, res) => {
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

  app.put("/api/communications/:id", async (req, res) => {
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

  app.delete("/api/communications/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteCommunication(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting communication:", error);
      res.status(500).json({ message: "Failed to delete communication" });
    }
  });

  // Customer Notes routes
  app.get("/api/customers/:customerId/notes", async (req, res) => {
    try {
      const customerId = req.params.customerId;
      const notes = await noteService.getNotesByCustomerId(customerId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching customer notes:", error);
      res.status(500).json({ message: "Failed to fetch customer notes" });
    }
  });

  app.post("/api/customers/:customerId/notes", async (req, res) => {
    try {
      const customerId = req.params.customerId;
      const { noteContent } = req.body;
      
      // Validate the input
      insertCustomerNoteSchema.parse({ customerId, noteContent });
      
      const note = await noteService.createNote(customerId, noteContent);
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating customer note:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer note" });
    }
  });

  app.put("/api/customers/notes/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { noteContent } = updateCustomerNoteSchema.parse(req.body);
      
      if (!noteContent) {
        return res.status(400).json({ message: "Note content is required" });
      }
      
      const note = await noteService.updateNote(id, noteContent);
      res.json(note);
    } catch (error) {
      console.error("Error updating customer note:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer note" });
    }
  });

  app.delete("/api/customers/notes/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await noteService.deleteNote(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer note:", error);
      res.status(500).json({ message: "Failed to delete customer note" });
    }
  });

  // Important Dates routes
  app.get("/api/customers/:customerId/important-dates", async (req, res) => {
    try {
      const customerId = req.params.customerId;
      const dates = await noteService.getImportantDatesByCustomerId(customerId);
      res.json(dates);
    } catch (error) {
      console.error("Error fetching important dates:", error);
      res.status(500).json({ message: "Failed to fetch important dates" });
    }
  });

  app.post("/api/customers/:customerId/important-dates", async (req, res) => {
    try {
      const customerId = req.params.customerId;
      const { description, date } = req.body;
      
      // Validate the input
      insertImportantDateSchema.parse({ customerId, description, date });
      
      const importantDate = await noteService.createImportantDate(customerId, description, date);
      res.status(201).json(importantDate);
    } catch (error) {
      console.error("Error creating important date:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create important date" });
    }
  });

  app.put("/api/customers/important-dates/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { description, date } = updateImportantDateSchema.parse(req.body);
      
      // At least one field must be provided (enforced by schema validation)
      const importantDate = await noteService.updateImportantDate(id, description, date);
      res.json(importantDate);
    } catch (error) {
      console.error("Error updating important date:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update important date" });
    }
  });

  app.delete("/api/customers/important-dates/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await noteService.deleteImportantDate(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting important date:", error);
      res.status(500).json({ message: "Failed to delete important date" });
    }
  });

  app.get("/api/important-dates/upcoming", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const upcomingDates = await noteService.getUpcomingImportantDates(days);
      res.json(upcomingDates);
    } catch (error) {
      console.error("Error fetching upcoming important dates:", error);
      res.status(500).json({ message: "Failed to fetch upcoming important dates" });
    }
  });

  // Process routes
  app.get("/api/processes", async (req, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const processes = await storage.getProcesses(customerId);
      res.json(processes);
    } catch (error) {
      console.error("Error fetching processes:", error);
      res.status(500).json({ message: "Failed to fetch processes" });
    }
  });

  app.get("/api/processes/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const process = await storage.getProcess(id);
      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }
      res.json(process);
    } catch (error) {
      console.error("Error fetching process:", error);
      res.status(500).json({ message: "Failed to fetch process" });
    }
  });
  app.post("/api/processes", async (req, res) => {
    try {
      const processData = insertProcessSchema.parse(req.body);
      
      // Explicitly remove any id field to avoid null value constraint issues
      if ('id' in processData) {
        console.log("Removing id field from process data before insertion");
        delete processData.id;
      }
      
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
  app.put("/api/processes/:id", async (req, res) => {
    try {      const id = req.params.id;
      
      // Parse the request body without converting customer/contact IDs to numbers
      const processData = updateProcessSchema.parse(req.body);
      console.log("PUT /api/processes/:id - Processing update for process ID:", id);
      console.log("PUT /api/processes/:id - Parsed process data:", processData);
      
      const process = await storage.updateProcess(id, processData);
      console.log("PUT /api/processes/:id - Updated process:", process);
      
      res.json(process);
    } catch (error) {
      console.error("Error updating process:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update process" });
    }
  });

  // Process Task routes
  app.get("/api/processes/:processId/tasks", async (req, res) => {
    try {
      const processId = req.params.processId;
      const tasks = await taskService.getTasksByProcessId(processId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching process tasks:", error);
      res.status(500).json({ message: "Failed to fetch process tasks" });
    }
  });

  app.post("/api/processes/:processId/tasks", async (req, res) => {
    try {
      const processId = req.params.processId;
      const taskData = insertProcessTaskSchema.parse({ ...req.body, processId });
      
      const task = await taskService.createTask(processId, taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating process task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create process task" });
    }
  });

  // Get upcoming tasks across all processes - MUST be before :id route
  app.get("/api/tasks/upcoming", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const upcomingTasks = await taskService.getUpcomingTasksAcrossAllProcesses(limit);
      res.json(upcomingTasks);
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
      res.status(500).json({ message: "Failed to fetch upcoming tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const updates = updateProcessTaskSchema.parse(req.body);
      
      const task = await taskService.updateTask(id, updates);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await taskService.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.post("/api/tasks/:id/subtasks", async (req, res) => {
    try {
      const parentTaskId = req.params.id;
      
      // Get the parent task to find the process ID
      const parentTask = await taskService.getTaskById(parentTaskId);
      if (!parentTask) {
        return res.status(404).json({ message: "Parent task not found" });
      }
      
      const taskData = insertProcessTaskSchema.parse({ 
        ...req.body, 
        processId: parentTask.processId,
        parentTaskId 
      });
      
      const subtask = await taskService.createTask(parentTask.processId, taskData);
      res.status(201).json(subtask);
    } catch (error) {
      console.error("Error creating subtask:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create subtask" });
    }
  });

  // Get progress for all processes - MUST be before :processId route
  app.get("/api/processes/progress/all", async (req, res) => {
    try {
      const progressData = await taskService.getAllProcessesProgress();
      res.json(progressData);
    } catch (error) {
      console.error("Error fetching all processes progress:", error);
      res.status(500).json({ message: "Failed to fetch processes progress" });
    }
  });

  app.get("/api/processes/:processId/progress", async (req, res) => {
    try {
      const processId = req.params.processId;
      const progress = await taskService.getTaskProgress(processId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching task progress:", error);
      res.status(500).json({ message: "Failed to fetch task progress" });
    }
  });

  // Process Milestone routes
  app.get("/api/processes/:processId/milestones", async (req, res) => {
    try {
      const processId = req.params.processId;
      const milestones = await taskService.getMilestonesByProcessId(processId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching process milestones:", error);
      res.status(500).json({ message: "Failed to fetch process milestones" });
    }
  });

  app.post("/api/processes/:processId/milestones", async (req, res) => {
    try {
      const processId = req.params.processId;
      const milestoneData = insertProcessMilestoneSchema.parse({ ...req.body, processId });
      
      const milestone = await taskService.createMilestone(processId, milestoneData);
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating process milestone:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create process milestone" });
    }
  });

  app.put("/api/milestones/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const updates = updateProcessMilestoneSchema.parse(req.body);
      
      const milestone = await taskService.updateMilestone(id, updates);
      res.json(milestone);
    } catch (error) {
      console.error("Error updating milestone:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });

  app.delete("/api/milestones/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await taskService.deleteMilestone(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting milestone:", error);
      res.status(500).json({ message: "Failed to delete milestone" });
    }
  });

  // Service routes
  app.get("/api/services", async (req, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const services = await storage.getServices(customerId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = req.params.id;
      // Get all services and filter by ID since there's no getService method
      const services = await storage.getServices();
      const service = services.find(s => s.id === id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post("/api/services", async (req, res) => {
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

  app.put("/api/services/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(id, serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteService(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      if (customerId) {
        const products = await productService.getProductsByCustomerId(customerId);
        res.json(products);
      } else {
        const products = await productService.getAllProducts();
        res.json(products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const product = await productService.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await productService.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const productData = updateProductSchema.parse(req.body);
      const product = await productService.updateProduct(id, productData);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await productService.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Product-Team assignment routes
  app.post("/api/products/:productId/teams", async (req, res) => {
    try {
      const productId = req.params.productId;
      const { teamId, isPrimary, responsibilityLevel } = assignTeamToProductSchema.parse(req.body);
      await productService.assignTeamToProduct(productId, teamId, isPrimary, responsibilityLevel);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error assigning team to product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to assign team to product" });
    }
  });

  app.delete("/api/products/:productId/teams/:teamId", async (req, res) => {
    try {
      const { productId, teamId } = req.params;
      await productService.unassignTeamFromProduct(productId, teamId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unassigning team from product:", error);
      res.status(500).json({ message: "Failed to unassign team from product" });
    }
  });

  // Get products by team
  app.get("/api/teams/:teamId/products", async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const products = await productService.getProductsByTeamId(teamId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products for team:", error);
      res.status(500).json({ message: "Failed to fetch products for team" });
    }
  });

  // Product metrics
  app.get("/api/products/metrics", async (req, res) => {
    try {
      const metrics = await productService.getProductMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching product metrics:", error);
      res.status(500).json({ message: "Failed to fetch product metrics" });
    }
  });

  // Products by team
  app.get("/api/products/team/:teamId", async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const products = await productService.getProductsByTeamId(teamId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products by team:", error);
      res.status(500).json({ message: "Failed to fetch products by team" });
    }
  });

  // Team routes
  app.get("/api/teams", async (req, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const teams = await storage.getTeams(customerId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = req.params.id;
      // Get all teams and filter by ID since there's no getTeam method
      const teams = await storage.getTeams();
      const team = teams.find(t => t.id === id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post("/api/teams", async (req, res) => {
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

  app.put("/api/teams/:id", async (req, res) => {
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

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteTeam(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Process-Team assignment routes
  app.get("/api/processes/:processId/teams", async (req, res) => {
    try {
      const processId = req.params.processId;
      const teams = await teamService.getTeamsByProcessId(processId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams for process:", error);
      res.status(500).json({ message: "Failed to fetch process teams" });
    }
  });

  app.post("/api/processes/:processId/teams/:teamId", async (req, res) => {
    try {
      const processId = req.params.processId;
      const teamId = req.params.teamId;
      await teamService.assignTeamToProcess(processId, teamId);
      res.status(201).json({ message: "Team assigned to process successfully" });
    } catch (error) {
      console.error("Error assigning team to process:", error);
      res.status(500).json({ message: "Failed to assign team to process" });
    }
  });

  app.delete("/api/processes/:processId/teams/:teamId", async (req, res) => {
    try {
      const processId = req.params.processId;
      const teamId = req.params.teamId;
      await teamService.unassignTeamFromProcess(processId, teamId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unassigning team from process:", error);
      res.status(500).json({ message: "Failed to unassign team from process" });
    }
  });

  // File Transfer routes
  app.get("/api/processes/:processId/file-transfers", async (req, res) => {
    try {
      const processId = req.params.processId;
      const transfers = await fileTransferService.getFileTransfersByProcessId(processId);
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching file transfers:", error);
      res.status(500).json({ message: "Failed to fetch file transfers" });
    }
  });

  app.post("/api/processes/:processId/file-transfers", async (req, res) => {
    try {
      const processId = req.params.processId;
      const transferData = insertFileTransferSchema.parse(req.body);
      const transfer = await fileTransferService.createFileTransfer(processId, transferData);
      res.status(201).json(transfer);
    } catch (error) {
      console.error("Error creating file transfer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create file transfer" });
    }
  });

  app.get("/api/file-transfers/:transferId", async (req, res) => {
    try {
      const transferId = req.params.transferId;
      const transfer = await fileTransferService.getFileTransferById(transferId);
      if (!transfer) {
        return res.status(404).json({ message: "File transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      console.error("Error fetching file transfer:", error);
      res.status(500).json({ message: "Failed to fetch file transfer" });
    }
  });

  app.put("/api/file-transfers/:transferId", async (req, res) => {
    try {
      const transferId = req.params.transferId;
      const updates = updateFileTransferSchema.parse(req.body);
      const transfer = await fileTransferService.updateFileTransfer(transferId, updates);
      res.json(transfer);
    } catch (error) {
      console.error("Error updating file transfer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update file transfer" });
    }
  });

  app.delete("/api/file-transfers/:transferId", async (req, res) => {
    try {
      const transferId = req.params.transferId;
      await fileTransferService.deleteFileTransfer(transferId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file transfer:", error);
      res.status(500).json({ message: "Failed to delete file transfer" });
    }
  });

  // Notification routes
  app.get("/api/processes/:processId/notifications", async (req, res) => {
    try {
      const processId = req.params.processId;
      const notifications = await notificationService.getNotificationsByProcessId(processId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/processes/:processId/notifications", async (req, res) => {
    try {
      const processId = req.params.processId;
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await notificationService.createNotification(processId, notificationData);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.get("/api/notifications/:notificationId", async (req, res) => {
    try {
      const notificationId = req.params.notificationId;
      const notification = await notificationService.getNotificationById(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error fetching notification:", error);
      res.status(500).json({ message: "Failed to fetch notification" });
    }
  });

  app.put("/api/notifications/:notificationId", async (req, res) => {
    try {
      const notificationId = req.params.notificationId;
      const updates = updateNotificationSchema.parse(req.body);
      const notification = await notificationService.updateNotification(notificationId, updates);
      res.json(notification);
    } catch (error) {
      console.error("Error updating notification:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.delete("/api/notifications/:notificationId", async (req, res) => {
    try {
      const notificationId = req.params.notificationId;
      await notificationService.deleteNotification(notificationId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Additional notification endpoints
  app.get("/api/processes/:processId/notifications/summary", async (req, res) => {
    try {
      const processId = req.params.processId;
      const summary = await notificationService.getNotificationSummary(processId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching notification summary:", error);
      res.status(500).json({ message: "Failed to fetch notification summary" });
    }
  });

  app.get("/api/notifications/events/types", async (req, res) => {
    try {
      const eventTypes = notificationService.getAvailableEventTypes();
      res.json(eventTypes);
    } catch (error) {
      console.error("Error fetching event types:", error);
      res.status(500).json({ message: "Failed to fetch event types" });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const documents = await storage.getDocuments(customerId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });  app.post("/api/documents", async (req, res) => {
    try {
      console.log("Document creation request received:", req.body);
      const documentData = insertDocumentSchema.parse(req.body);
      console.log("Document data after validation:", documentData);
      
      // Add required uploadDate field
      const documentWithUploadDate = {
        ...documentData,
        uploadDate: new Date().toISOString()
      };
      console.log("Document data with uploadDate:", documentWithUploadDate);
      
      const document = await storage.createDocument(documentWithUploadDate);
      console.log("Document created successfully:", document);
      res.status(201).json(document);    } catch (error) {
      console.error("Error creating document:", error);
      console.error("Error stack:", (error as Error).stack);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Get document tags for a customer
  app.get("/api/documents/tags", async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      // Return mock tags for now - in a real app, this would aggregate tags from documents
      const tags = ['important', 'contract', 'technical', 'proposal', 'meeting-notes'];
      res.json(tags);
    } catch (error) {
      console.error("Error fetching document tags:", error);
      res.status(500).json({ message: "Failed to fetch document tags" });
    }
  });

  // Toggle document favorite status
  app.patch("/api/documents/:id/favorite", async (req, res) => {
    try {
      const documentId = req.params.id;
      const { isFavorite } = req.body;
      
      // For now, just return success - in a real app, this would update the database
      res.json({ success: true, isFavorite });
    } catch (error) {
      console.error("Error updating document favorite status:", error);
      res.status(500).json({ message: "Failed to update document favorite status" });
    }
  });
  // Delete a document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const documentId = req.params.id;
      await storage.deleteDocument(documentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Process document routes
  app.get("/api/processes/:processId/documents", async (req, res) => {
    try {
      const processId = req.params.processId;
      const documents = await storage.getDocumentsByProcessId(processId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching process documents:", error);
      res.status(500).json({ message: "Failed to fetch process documents" });
    }
  });
  app.post("/api/processes/:processId/documents", async (req, res) => {
    try {
      const processId = req.params.processId;
      console.log("POST /api/processes/:processId/documents called");
      console.log("processId:", processId);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const documentData = insertDocumentSchema.parse(req.body);
      console.log("Document data after validation:", JSON.stringify(documentData, null, 2));
      
      // Add required uploadDate field
      const documentWithUploadDate = {
        ...documentData,
        uploadDate: new Date().toISOString()
      };
      console.log("Document data with uploadDate:", JSON.stringify(documentWithUploadDate, null, 2));
      
      const document = await storage.createDocumentForProcess(processId, documentWithUploadDate);
      console.log("Document created successfully:", JSON.stringify(document, null, 2));
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating process document:", error);
      console.error("Error stack:", (error as Error).stack);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create process document" });
    }
  });

  app.post("/api/processes/:processId/documents/:documentId/attach", async (req, res) => {
    try {
      const { processId, documentId } = req.params;
      await storage.attachDocumentToProcess(processId, documentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error attaching document to process:", error);
      res.status(500).json({ message: "Failed to attach document to process" });
    }
  });

  app.delete("/api/processes/:processId/documents/:documentId", async (req, res) => {
    try {
      const { processId, documentId } = req.params;
      await storage.removeDocumentFromProcess(processId, documentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing document from process:", error);
      res.status(500).json({ message: "Failed to remove document from process" });
    }
  });
  app.get("/api/processes/:processId/available-documents", async (req, res) => {
    try {
      const processId = req.params.processId;
      const customerId = req.query.customerId as string;
      
      if (!customerId) {
        return res.status(400).json({ message: "customerId query parameter is required" });
      }
      
      const documents = await storage.getAvailableDocumentsForProcess(processId, customerId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching available documents for process:", error);
      res.status(500).json({ message: "Failed to fetch available documents for process" });
    }
  });

  // Process Timeline routes
  app.post("/api/process-timeline", async (req, res) => {
    try {
      const eventData = insertProcessTimelineEventSchema.parse(req.body);
      const processTimelineEventData = {
        processId: eventData.processId,
        stage: eventData.stage,
        description: eventData.description,
        date: new Date(eventData.date).toISOString()
      };
      
      const createdEvent = await storage.createProcessTimelineEvent(processTimelineEventData);
      res.status(201).json(createdEvent);
    } catch (error: any) {
      console.error("Error creating process timeline event:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid process timeline event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create process timeline event" });
      }
    }
  });

  // AI Chat routes
  app.get("/api/chat/sessions", async (req: any, res) => {
    try {
      const userId = req.session.user?.id || req.user?.id || 'demo-user-123';
      const sessions = await storage.getChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });
  app.post("/api/chat/sessions", async (req: any, res) => {
    try {
      const userId = req.session.user?.id || req.user?.id || 'demo-user-123';
      const sessionData = insertAiChatSessionSchema.parse({
        ...req.body,
        userId,
      });
      
      // Add the required properties for ChatSession
      const chatSessionData = {
        ...sessionData,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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

  app.get("/api/chat/sessions/:id/messages", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/sessions/:id/messages", async (req, res) => {
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
  app.get("/api/ai/config", async (req, res) => {
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

  app.post("/api/ai/config", async (req, res) => {
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

  app.get("/api/ai/models", async (req, res) => {
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

  // PDF Report Generation endpoints
  app.get("/api/customers/:id/report-data", async (req, res) => {
    try {
      const customerId = req.params.id;
      console.log(`📊 Generating report data for customer: ${customerId}`);
      
      const reportData = await reportService.getCustomerReportData(customerId);
      res.json(reportData);
    } catch (error) {
      console.error("❌ Error generating report data:", error);
      res.status(500).json({ message: "Failed to generate report data" });
    }
  });

  app.post("/api/customers/:id/export-pdf", async (req, res) => {
    try {
      const customerId = req.params.id;
      const options = req.body.options || {};
      
      console.log(`📄 Generating PDF report for customer: ${customerId}`);
      console.log(`📄 PDF options:`, JSON.stringify(options));
      
      // Get report data
      console.log(`📊 Fetching report data...`);
      const reportData = await reportService.getCustomerReportData(customerId);
      console.log(`✅ Report data fetched successfully`);
      
      // Generate PDF using simple service (reliable cross-platform)
      console.log(`🎯 Starting PDF generation with simple service...`);
      const pdfBuffer = await simplePdfService.generateCustomerReport(reportData, options);
      console.log(`✅ PDF generated successfully, size: ${pdfBuffer.length} bytes`);
      
      // Set response headers for PDF download
      const fileName = `${reportData.customer.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
      
      console.log(`✅ PDF report generated successfully for ${reportData.customer.name}`);
    } catch (error) {
      console.error("❌ Error generating PDF report:", error);
      res.status(500).json({ 
        message: "Failed to generate PDF report",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
