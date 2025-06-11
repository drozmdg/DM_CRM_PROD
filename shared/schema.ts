import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phase: text("phase").notNull(), // Contracting, New Activation, Steady State, etc.
  contractStartDate: date("contract_start_date"),
  contractEndDate: date("contract_end_date"),
  logoUrl: text("logo_url"),
  avatarColor: text("avatar_color").notNull().default("#1976D2"),
  active: boolean("active").notNull().default(true), // Soft delete flag
  inactivatedAt: timestamp("inactivated_at"), // When customer was inactivated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts table
export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  name: text("name").notNull(),
  title: text("title"),
  email: text("email").notNull(),
  phone: text("phone"),
  role: text("role"),
  type: text("type").notNull(), // Client, Internal
  createdAt: timestamp("created_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  financeCode: text("finance_code").notNull(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  name: text("name").notNull(),
  monthlyHours: integer("monthly_hours").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Processes table
export const processes = pgTable("processes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  jiraTicket: text("jira_ticket"),
  status: text("status").notNull(), // Not Started, In Progress, Completed
  sdlcStage: text("sdlc_stage").notNull(), // Requirements, Design, Development, Testing, Deployment, Maintenance
  startDate: date("start_date").notNull(),
  dueDate: date("due_date"),
  approvalStatus: text("approval_status").notNull().default("Pending"), // Pending, Approved, Rejected, Not Required
  estimate: integer("estimate"), // hours
  functionalArea: text("functional_area"),
  responsibleContactId: text("responsible_contact_id").references(() => contacts.id),
  progress: integer("progress").default(0), // percentage 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // Contract, Proposal, Requirements, Design, Technical, Report, Invoice, Other
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Timeline events table
export const timelineEvents = pgTable("timeline_events", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id),
  processId: text("process_id").references(() => processes.id),
  eventType: text("event_type").notNull(), // customer_created, process_started, document_uploaded, etc.
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Chat sessions table
export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: text("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title"),
  model: text("model").notNull().default("llama2"),
  systemPrompt: text("system_prompt"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Chat messages table
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => aiChatSessions.id).notNull(),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Communications table
export const communications = pgTable("communications", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").references(() => contacts.id).notNull(),
  type: text("type").notNull(), // email, phone, meeting, other
  subject: text("subject").notNull(),
  notes: text("notes").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  contacts: many(contacts),
  services: many(services),
  processes: many(processes),
  documents: many(documents),
  timelineEvents: many(timelineEvents),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [contacts.customerId],
    references: [customers.id],
  }),
  responsibleProcesses: many(processes),
  communications: many(communications),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  customer: one(customers, {
    fields: [services.customerId],
    references: [customers.id],
  }),
}));

export const processesRelations = relations(processes, ({ one, many }) => ({
  customer: one(customers, {
    fields: [processes.customerId],
    references: [customers.id],
  }),
  responsibleContact: one(contacts, {
    fields: [processes.responsibleContactId],
    references: [contacts.id],
  }),
  timelineEvents: many(timelineEvents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  customer: one(customers, {
    fields: [documents.customerId],
    references: [customers.id],
  }),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  customer: one(customers, {
    fields: [timelineEvents.customerId],
    references: [customers.id],
  }),
  process: one(processes, {
    fields: [timelineEvents.processId],
    references: [processes.id],
  }),
}));

export const aiChatSessionsRelations = relations(aiChatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [aiChatSessions.userId],
    references: [users.id],
  }),
  messages: many(aiChatMessages),
}));

export const aiChatMessagesRelations = relations(aiChatMessages, ({ one }) => ({
  session: one(aiChatSessions, {
    fields: [aiChatMessages.sessionId],
    references: [aiChatSessions.id],
  }),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  contact: one(contacts, {
    fields: [communications.contactId],
    references: [contacts.id],
  }),
}));

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertProcessSchema = createInsertSchema(processes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertTimelineEventSchema = createInsertSchema(timelineEvents).omit({
  id: true,
  createdAt: true,
});

export const insertAiChatSessionSchema = createInsertSchema(aiChatSessions).omit({
  id: true,
  createdAt: true,
});

export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Process = typeof processes.$inferSelect;
export type InsertProcess = z.infer<typeof insertProcessSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type AiChatSession = typeof aiChatSessions.$inferSelect;
export type InsertAiChatSession = z.infer<typeof insertAiChatSessionSchema>;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
