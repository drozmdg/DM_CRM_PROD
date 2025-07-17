export type CustomerPhase =
  | 'Contracting'
  | 'New Activation'
  | 'Steady State'
  | 'Steady State + New Activation'
  | 'Pending Termination'
  | 'Terminated';

export type UserRole = 'Admin' | 'Manager' | 'Viewer';

export type ContactType = 'Client' | 'Internal';

export interface Contact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  role: string;
  type: ContactType;
}

export type DocumentCategory =
  | 'Contract'
  | 'Proposal'
  | 'Requirements'
  | 'Design'
  | 'Technical'
  | 'Report'
  | 'Invoice'
  | 'Other';

export interface Document {
  id: string;
  name: string;
  description?: string;
  url: string;
  uploadDate: string;
  type: string; // File type (PDF, DOCX, etc.)
  category: DocumentCategory;
  size?: number; // File size in bytes
}

export interface Team {
  id: string;
  name: string;
  financeCode: string;
}

export type SDLCStage =
  | 'Requirements'
  | 'Design'
  | 'Development'
  | 'Testing'
  | 'Deployment'
  | 'Maintenance';

export type ApprovalStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Not Required';

export type FunctionalArea =
  | 'Standard Data Ingestion'
  | 'Custom Data Ingestion'
  | 'Standard Extract'
  | 'Custom Extract'
  | 'CRM Refresh'
  | 'New Team Implementation';

export interface ProcessTimelineEvent {
  id: string;
  date: string;
  stage: SDLCStage;
  description: string;
}

export type OutputDeliveryMethod =
  | 'Email'
  | 'SFTP'
  | 'API'
  | 'Database'
  | 'SharePoint'
  | 'Other'
  | 'none';

export interface Process {
  id: string;
  name: string;
  jiraTicket?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  startDate: string;
  dueDate?: string;
  endDate?: string;
  sdlcStage: SDLCStage;
  estimate?: number; // Estimated hours
  devSprint?: string;
  approvalStatus: ApprovalStatus;
  approvedDate?: string;
  deployedDate?: string;
  supportedTeamIds?: string[]; // IDs of teams this process supports
  timeline: ProcessTimelineEvent[]; // Timeline of SDLC stages
  functionalArea?: FunctionalArea; // Type of functional work
  documentIds?: string[]; // IDs of documents linked to this process
  contactId?: string; // ID of the contact responsible for this process
  outputDeliveryMethod?: OutputDeliveryMethod; // Method for delivering output (for extracts)
  outputDeliveryDetails?: string; // Additional details about output delivery
  customerId: string; // ID of the customer this process belongs to
}

export interface Service {
  id: string;
  name: string;
  monthlyHours: number;
  customerId: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'phase-change' | 'project-added' | 'process-launched' | 'other';
  icon?: string;
  metadata?: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  teams: Team[];
  processes: string[]; // Array of process IDs
  services: Service[];
  startDate: string;
  endDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  logo?: string;
  avatarColor?: string; // Color for the avatar background
  phase: CustomerPhase;
  teams: Team[];
  processes: Process[];
  services: Service[];
  contacts: Contact[];
  documents: Document[];
  timeline: TimelineEvent[];
  projects: Project[]; // Added projects array
  contractStartDate?: string;
  contractEndDate?: string;
  active: boolean; // Soft delete flag
  inactivatedAt?: string; // When customer was inactivated
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type MessageSender = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: string;
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface OllamaConfig {
  endpoint: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  useSystemPrompt?: boolean;
}

export interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}
