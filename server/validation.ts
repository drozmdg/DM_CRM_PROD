/**
 * Validation schemas for API endpoints
 * Using Zod for runtime validation
 */

import { z } from 'zod';

// Customer schemas
export const insertCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phase: z.enum([
    'Contracting',
    'New Activation',
    'Steady State',
    'Steady State + New Activation',
    'Pending Termination',
    'Terminated'
  ]),
  logo: z.string().optional(),
  avatarColor: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  teams: z.array(z.object({
    id: z.string().default(() => crypto.randomUUID()),
    name: z.string(),
    financeCode: z.string()
  })).optional().default([]),
  contacts: z.array(z.object({
    id: z.string().default(() => crypto.randomUUID()),
    name: z.string(),
    title: z.string().default(''),
    email: z.string().default(''),
    phone: z.string().default(''),
    role: z.string().default(''),
    type: z.enum(['Client', 'Internal']).default('Client')
  })).optional().default([]),
  services: z.array(z.object({
    id: z.string().default(() => crypto.randomUUID()),
    name: z.string(),
    monthlyHours: z.number().min(0)
  })).optional().default([]),
  processes: z.array(z.any()).optional().default([]),
  documents: z.array(z.any()).optional().default([]),
  timeline: z.array(z.any()).optional().default([]),
  projects: z.array(z.any()).optional().default([])
});

// Contact schemas
export const insertContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  type: z.enum(['Client', 'Internal']).default('Client'),
  customerId: z.string().uuid()
});

// Team schemas
export const insertTeamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  financeCode: z.string().min(1, 'Finance code is required'),
  customerId: z.string().uuid()
});

// Service schemas
export const insertServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  monthlyHours: z.number().min(0, 'Monthly hours must be non-negative'),
  customerId: z.string().uuid()
});

// Process schemas
export const insertProcessSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  jiraTicket: z.string().optional(),
  status: z.enum(['Not Started', 'In Progress', 'Completed']).default('Not Started'),
  startDate: z.string(),
  dueDate: z.string().optional(),
  endDate: z.string().optional(),
  sdlcStage: z.enum([
    'Requirements',
    'Design',
    'Development',
    'Testing',
    'Deployment',
    'Maintenance'
  ]).default('Requirements'),
  estimate: z.number().min(0).optional(),
  devSprint: z.string().optional(),
  approvalStatus: z.enum(['Pending', 'Approved', 'Rejected', 'Not Required']).default('Not Required'),
  approvedDate: z.string().optional(),
  deployedDate: z.string().optional(),
  functionalArea: z.enum([
    'Standard Data Ingestion',
    'Custom Data Ingestion',
    'Standard Extract',
    'Custom Extract',
    'CRM Refresh',
    'New Team Implementation'
  ]).optional(),
  contactId: z.string().uuid().optional(),
  outputDeliveryMethod: z.enum([
    'Email',
    'SFTP',
    'API',
    'Database',
    'SharePoint',
    'Other',
    'none'
  ]).default('none'),
  outputDeliveryDetails: z.string().optional(),
  customerId: z.string().uuid()
});

// Document schemas
export const insertDocumentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  url: z.string().url('Must be a valid URL'),
  type: z.string().min(1, 'Type is required'),
  category: z.enum([
    'Contract',
    'Proposal',
    'Requirements',
    'Design',
    'Technical',
    'Report',
    'Invoice',
    'Other'
  ]).default('Other'),
  size: z.number().min(0).optional(),
  customerId: z.string().uuid()
});

// Timeline event schemas
export const insertTimelineEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string(),
  type: z.enum(['phase-change', 'project-added', 'process-launched', 'other']).default('other'),
  icon: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  customerId: z.string().uuid()
});

// Chat session schemas
export const insertAiChatSessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  userId: z.string().optional()
});

// Chat message schemas
export const insertAiChatMessageSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  sender: z.enum(['user', 'ai']),
  sessionId: z.string().uuid(),
  timestamp: z.string().optional().default(() => new Date().toISOString()),
  isLoading: z.boolean().optional().default(false)
});

// Communication schemas
export const insertCommunicationSchema = z.object({
  contactId: z.number().int().positive('Contact ID must be a positive integer'),
  type: z.enum(['email', 'phone', 'meeting', 'other']),
  subject: z.string().min(1, 'Subject is required'),
  notes: z.string().min(1, 'Notes are required'),
  date: z.string().min(1, 'Date is required')
});

// Update schemas (partial versions of insert schemas)
export const updateCustomerSchema = insertCustomerSchema.partial();
export const updateContactSchema = insertContactSchema.partial();
export const updateTeamSchema = insertTeamSchema.partial();
export const updateServiceSchema = insertServiceSchema.partial();
export const updateProcessSchema = insertProcessSchema.partial();
export const updateDocumentSchema = insertDocumentSchema.partial();
export const updateTimelineEventSchema = insertTimelineEventSchema.partial();
export const updateAiChatSessionSchema = insertAiChatSessionSchema.partial();
export const updateAiChatMessageSchema = insertAiChatMessageSchema.partial();
export const updateCommunicationSchema = insertCommunicationSchema.partial();
