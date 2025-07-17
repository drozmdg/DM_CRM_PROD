/**
 * Types for PDF Report System
 */

export interface CustomerReportData {
  customer: {
    id: string;
    name: string;
    phase: string;
    avatarColor?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  };

  summary: {
    totalProcesses: number;
    activeProcesses: number;
    completedProcesses: number;
    totalTeams: number;
    totalServices: number;
    totalMonthlyHours: number;
    totalDocuments: number;
    totalContacts: number;
  };

  analytics: {
    processCompletionRate: number;
    averageProgress: number;
    onTimeDelivery: number;
    serviceUtilization: number;
  };

  processes: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    sdlcStage: string;
    startDate: string;
    dueDate?: string;
    endDate?: string;
    progress?: number;
    estimate?: number;
    functionalArea?: string;
    approvalStatus: string;
    jiraTicket?: string;
    isTpaRequired?: boolean;
    tpaDataSource?: string;
    tpaStartDate?: string;
    tpaEndDate?: string;
    tpaResponsibleContactId?: string;
  }>;

  teams: Array<{
    id: string;
    name: string;
    financeCode: string;
    startDate?: string;
    endDate?: string;
    createdAt: string;
  }>;

  services: Array<{
    id: string;
    name: string;
    monthlyHours: number;
    createdAt: string;
  }>;

  contacts: Array<{
    id: string;
    name: string;
    title?: string;
    email: string;
    phone?: string;
    role?: string;
    type: string;
    createdAt: string;
  }>;

  documents: Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    fileSize?: number;
    mimeType?: string;
    uploadedAt: string;
  }>;

  products?: Array<{
    id: string;
    name: string;
    description?: string;
    code?: string;
    isActive: boolean;
    therapeuticArea?: string;
    drugClass?: string;
    indication?: string;
    regulatoryStatus?: string;
  }>;

  importantDates?: Array<{
    id: string;
    description: string;
    date: string;
    createdAt: string;
  }>;

  notes?: Array<{
    id: string;
    noteContent: string;
    createdAt: string;
    updatedAt: string;
  }>;

  fileTransfers?: Array<{
    id: string;
    direction: string;
    connectionType: string;
    sourcePath: string;
    destinationPath?: string;
    filePattern?: string;
    scheduleType: string;
    isActive: boolean;
  }>;

  recentActivity?: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
    metadata?: any;
  }>;
}

export interface ReportGenerationOptions {
  includeCharts?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  sections?: string[];
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  customization?: {
    companyLogo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface ReportExportRequest {
  customerId: string;
  options: ReportGenerationOptions;
  fileName?: string;
}

export interface ReportExportResponse {
  success: boolean;
  fileName?: string;
  downloadUrl?: string;
  error?: string;
  size?: number;
  generatedAt: string;
}