export type CustomerPhase =
  | 'Contracting'
  | 'New Activation'
  | 'Steady State'
  | 'Steady State + New Activation'
  | 'Pending Termination'
  | 'Terminated';

export type UserRole = 'Admin' | 'Manager' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export type ContactType = 'Client' | 'Internal' | 'Vendor' | 'Partner' | 'Consultant' | 'External Stakeholder';

export type TherapeuticArea =
  | 'Oncology'
  | 'Cardiology'
  | 'Neurology'
  | 'Immunology'
  | 'Infectious Disease'
  | 'Endocrinology'
  | 'Gastroenterology'
  | 'Respiratory'
  | 'Dermatology'
  | 'Ophthalmology'
  | 'Psychiatry'
  | 'Rheumatology'
  | 'Rare Disease'
  | 'Other';

export type DrugClass =
  | 'Monoclonal Antibody'
  | 'Small Molecule'
  | 'Protein Therapeutic'
  | 'Gene Therapy'
  | 'Cell Therapy'
  | 'Vaccine'
  | 'Biosimilar'
  | 'Combination Therapy'
  | 'Radiopharmaceutical'
  | 'Medical Device'
  | 'Diagnostic'
  | 'Other';

export type RegulatoryStatus =
  | 'Approved'
  | 'Phase III'
  | 'Phase II'
  | 'Phase I'
  | 'Pre-clinical'
  | 'Discovery'
  | 'Discontinued'
  | 'On Hold';

export type ResponsibilityLevel =
  | 'Primary'
  | 'Secondary'
  | 'Support';

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  role: string;
  type: ContactType;
}

export type CommunicationType = 'email' | 'phone' | 'meeting' | 'other';

export interface Communication {
  id: string;
  contactId: string;
  type: CommunicationType;
  subject: string;
  notes: string;
  date: string;
  createdAt: string;
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
  customerId: string; // Customer ID for document association
  processInfo?: {
    id: string;
    name: string;
    status: string;
    stage: SDLCStage;
    functionalArea: FunctionalArea;
  };
}

export interface Team {
  id: string;
  name: string;
  financeCode: string;
  startDate?: string;
  endDate?: string;
  products?: TeamProduct[]; // Products supported by this team
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
  | 'Other';

export interface Process {
  id: string;
  name: string;
  description?: string;
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
  functionalArea?: FunctionalArea; // Type of functional work
  documentIds?: string[]; // IDs of documents linked to this process
  responsibleContactId?: string; // ID of the contact responsible for this process
  progress?: number; // Progress percentage (0-100)
  outputDeliveryMethod?: OutputDeliveryMethod; // Method for delivering output (for extracts)
  outputDeliveryDetails?: string; // Additional details about output delivery
  timeline: ProcessTimelineEvent[]; // Timeline of SDLC stages
  customerId: string; // ID of the customer this process belongs to
  // TPA (Third-Party Agreement) fields
  isTpaRequired?: boolean; // Whether a TPA is required for this process
  tpaResponsibleContactId?: string; // ID of the contact responsible for the TPA
  tpaDataSource?: string; // Name of the data source governed by the TPA
  tpaStartDate?: string; // Start date of the TPA
  tpaEndDate?: string; // End date of the TPA
}

export interface Service {
  id: string;
  name: string;
  monthlyHours: number;
  customerId: string;
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
  projects: Project[]; // Added projects array
  products?: Product[]; // Products offered to this customer
  contractStartDate?: string;
  contractEndDate?: string;
  active: boolean; // Soft delete flag
  inactivatedAt?: string; // When customer was inactivated
  createdAt: string;
  updatedAt: string;
  notes?: CustomerNote[];
  importantDates?: CustomerImportantDate[];
}

// Customer Note interface
export interface CustomerNote {
  id: string;
  customerId: string;
  noteContent: string;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Customer Important Date interface
export interface CustomerImportantDate {
  id: string;
  customerId: string;
  description: string;
  date: string; // Format: YYYY-MM-DD
  active?: boolean;
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


export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type MilestoneType = 
  | 'Requirements Complete'
  | 'Requirements Approved Client'
  | 'Requirements Approved Dev'
  | 'Estimate Received'
  | 'Estimate Internal Partner Review'
  | 'Estimate Internal Approval Received'
  | 'Sprint(s) Confirmed'
  | 'Development Started'
  | 'Development Completed'
  | 'UAT Started'
  | 'UAT Approved'
  | 'Deployment Date'
  | 'Production Release Date'
  | 'Process Implementation Complete';

export interface ProcessTask {
  id: string;
  processId: string;
  parentTaskId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId?: string | null;
  dueDate?: string | null;
  completedDate?: string | null;
  subtasks?: ProcessTask[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcessMilestone {
  id: string;
  processId: string;
  milestoneType: MilestoneType;
  achievedDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  customerId: string;
  name: string;
  description?: string;
  code?: string; // Product code or SKU
  isActive: boolean;
  therapeuticArea?: TherapeuticArea; // Medical therapeutic area/specialty
  drugClass?: DrugClass; // Classification of the pharmaceutical product type
  indication?: string; // Medical condition or indication the product treats
  regulatoryStatus?: RegulatoryStatus; // Current regulatory development status
  teams?: TeamProduct[]; // Teams that manage this product
  createdAt: string;
  updatedAt: string;
}

export interface TeamProduct {
  teamId: string;
  productId: string;
  assignedDate: string;
  isPrimary: boolean; // Indicates if this is the primary team for the product
  responsibilityLevel?: ResponsibilityLevel; // Level of team responsibility (Primary, Secondary, Support)
  team?: Team; // Optional team details when joined
  product?: Product; // Optional product details when joined
}

