/**
 * Report Service - Aggregates comprehensive customer data for PDF reports
 */

import { supabase } from '../supabase.js';
import { CustomerReportData } from '../../../shared/types/reports.js';

export class ReportService {
  
  /**
   * Get comprehensive customer report data
   */
  async getCustomerReportData(customerId: string): Promise<CustomerReportData> {
    try {
      console.log(`📊 Aggregating report data for customer: ${customerId}`);

      // Run all queries in parallel for better performance
      const [
        customerResult,
        processesResult,
        teamsResult,
        servicesResult,
        contactsResult,
        documentsResult,
        productsResult,
        notesResult,
        importantDatesResult,
        fileTransfersResult,
        recentActivityResult
      ] = await Promise.all([
        this.getCustomerInfo(customerId),
        this.getProcesses(customerId),
        this.getTeams(customerId),
        this.getServices(customerId),
        this.getContacts(customerId),
        this.getDocuments(customerId),
        this.getProducts(customerId),
        this.getNotes(customerId),
        this.getImportantDates(customerId),
        this.getFileTransfers(customerId),
        this.getRecentActivity(customerId)
      ]);

      // Calculate summary statistics
      const summary = this.calculateSummary({
        processes: processesResult,
        teams: teamsResult,
        services: servicesResult,
        contacts: contactsResult,
        documents: documentsResult
      });

      // Calculate analytics
      const analytics = this.calculateAnalytics({
        processes: processesResult,
        services: servicesResult
      });

      const reportData: CustomerReportData = {
        customer: customerResult,
        summary,
        analytics,
        processes: processesResult,
        teams: teamsResult,
        services: servicesResult,
        contacts: contactsResult,
        documents: documentsResult,
        products: productsResult,
        notes: notesResult,
        importantDates: importantDatesResult,
        fileTransfers: fileTransfersResult,
        recentActivity: recentActivityResult
      };

      console.log(`✅ Report data aggregated successfully for ${customerResult.name}`);
      return reportData;

    } catch (error) {
      console.error('❌ Error aggregating report data:', error);
      throw new Error(`Failed to aggregate report data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get customer information
   */
  private async getCustomerInfo(customerId: string): Promise<CustomerReportData['customer']> {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) throw error;
    if (!customer) throw new Error('Customer not found');

    return {
      id: customer.id,
      name: customer.name,
      phase: customer.phase,
      avatarColor: customer.avatar_color,
      contractStartDate: customer.contract_start_date,
      contractEndDate: customer.contract_end_date,
      active: customer.active,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    };
  }

  /**
   * Get all processes for the customer
   */
  private async getProcesses(customerId: string): Promise<CustomerReportData['processes']> {
    const { data: processes, error } = await supabase
      .from('processes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (processes || []).map(process => ({
      id: process.id,
      name: process.name,
      description: process.description,
      status: process.status,
      sdlcStage: process.sdlc_stage,
      startDate: process.start_date,
      dueDate: process.due_date,
      endDate: process.end_date,
      progress: process.progress || 0,
      estimate: process.estimate,
      functionalArea: process.functional_area,
      approvalStatus: process.approval_status,
      jiraTicket: process.jira_ticket,
      isTpaRequired: process.is_tpa_required || false,
      tpaDataSource: process.tpa_data_source,
      tpaStartDate: process.tpa_start_date,
      tpaEndDate: process.tpa_end_date,
      tpaResponsibleContactId: process.tpa_responsible_contact_id
    }));
  }

  /**
   * Get all teams for the customer
   */
  private async getTeams(customerId: string): Promise<CustomerReportData['teams']> {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (teams || []).map(team => ({
      id: team.id,
      name: team.name,
      financeCode: team.finance_code,
      startDate: team.start_date,
      endDate: team.end_date,
      createdAt: team.created_at
    }));
  }

  /**
   * Get all services for the customer
   */
  private async getServices(customerId: string): Promise<CustomerReportData['services']> {
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (services || []).map(service => ({
      id: service.id,
      name: service.name,
      monthlyHours: service.monthly_hours,
      createdAt: service.created_at
    }));
  }

  /**
   * Get all contacts for the customer
   */
  private async getContacts(customerId: string): Promise<CustomerReportData['contacts']> {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (contacts || []).map(contact => ({
      id: contact.id,
      name: contact.name,
      title: contact.title,
      email: contact.email,
      phone: contact.phone,
      role: contact.role,
      type: contact.type,
      createdAt: contact.created_at
    }));
  }

  /**
   * Get all documents for the customer
   */
  private async getDocuments(customerId: string): Promise<CustomerReportData['documents']> {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('customer_id', customerId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (documents || []).map(doc => ({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      category: doc.category,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      uploadedAt: doc.updated_at || doc.created_at
    }));
  }

  /**
   * Get pharmaceutical products for the customer
   */
  private async getProducts(customerId: string): Promise<CustomerReportData['products']> {
    try {
      const { data: products, error } = await supabase
        .from('pharmaceutical_products')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Products table not available or error fetching products:', error.message);
        return [];
      }

      return (products || []).map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        code: product.code,
        isActive: product.is_active,
        therapeuticArea: product.therapeutic_area,
        drugClass: product.drug_class,
        indication: product.indication,
        regulatoryStatus: product.regulatory_status
      }));
    } catch (error) {
      console.warn('Error fetching products (table may not exist):', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Get customer notes
   */
  private async getNotes(customerId: string): Promise<CustomerReportData['notes']> {
    try {
      const { data: notes, error } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('Notes table not available:', error.message);
        return [];
      }

      return (notes || []).map(note => ({
        id: note.id,
        noteContent: note.note_content,
        createdAt: note.created_at,
        updatedAt: note.updated_at
      }));
    } catch (error) {
      console.warn('Error fetching notes (table may not exist):', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Get important dates for the customer
   */
  private async getImportantDates(customerId: string): Promise<CustomerReportData['importantDates']> {
    try {
      const { data: dates, error } = await supabase
        .from('customer_important_dates')
        .select('*')
        .eq('customer_id', customerId)
        .order('date', { ascending: true });

      if (error) {
        console.warn('Important dates table not available:', error.message);
        return [];
      }

      return (dates || []).map(date => ({
        id: date.id,
        description: date.description,
        date: date.date,
        createdAt: date.created_at
      }));
    } catch (error) {
      console.warn('Error fetching important dates (table may not exist):', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Get file transfer configurations for customer processes
   */
  private async getFileTransfers(customerId: string): Promise<CustomerReportData['fileTransfers']> {
    try {
      // Get file transfers for all processes belonging to this customer
      const { data: transfers, error } = await supabase
        .from('process_file_transfers')
        .select(`
          *,
          processes!inner(customer_id)
        `)
        .eq('processes.customer_id', customerId);

      if (error) {
        console.warn('File transfers table not available:', error.message);
        return [];
      }

      return (transfers || []).map(transfer => ({
        id: transfer.id,
        direction: transfer.direction,
        connectionType: transfer.connection_type,
        sourcePath: transfer.source_path,
        destinationPath: transfer.destination_path,
        filePattern: transfer.file_pattern,
        scheduleType: transfer.schedule_type,
        isActive: transfer.is_active
      }));
    } catch (error) {
      console.warn('Error fetching file transfers (table may not exist):', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Get recent activity for the customer
   */
  private async getRecentActivity(customerId: string): Promise<CustomerReportData['recentActivity']> {
    try {
      // Try to get process timeline events as a fallback
      const { data: events, error } = await supabase
        .from('process_timeline_events')
        .select(`
          *,
          processes!inner(customer_id)
        `)
        .eq('processes.customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Process timeline events not available:', error.message);
        return [];
      }

      return (events || []).map(event => ({
        id: event.id,
        type: event.event_type || 'Process Event',
        description: event.description || event.title || 'Process activity',
        date: event.created_at,
        metadata: event.metadata
      }));
    } catch (error) {
      console.warn('Error fetching recent activity:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(data: {
    processes: any[];
    teams: any[];
    services: any[];
    contacts: any[];
    documents: any[];
  }): CustomerReportData['summary'] {
    const totalMonthlyHours = data.services.reduce((sum, service) => sum + service.monthlyHours, 0);
    const activeProcesses = data.processes.filter(p => p.status === 'In Progress' || p.status === 'Active').length;
    const completedProcesses = data.processes.filter(p => p.status === 'Completed').length;

    return {
      totalProcesses: data.processes.length,
      activeProcesses,
      completedProcesses,
      totalTeams: data.teams.length,
      totalServices: data.services.length,
      totalMonthlyHours,
      totalDocuments: data.documents.length,
      totalContacts: data.contacts.length
    };
  }

  /**
   * Calculate analytics metrics
   */
  private calculateAnalytics(data: {
    processes: any[];
    services: any[];
  }): CustomerReportData['analytics'] {
    const processes = data.processes;
    const services = data.services;

    // Process completion rate
    const completedProcesses = processes.filter(p => p.status === 'Completed').length;
    const processCompletionRate = processes.length > 0 ? Math.round((completedProcesses / processes.length) * 100) : 0;

    // Average progress across all processes
    const totalProgress = processes.reduce((sum, p) => sum + (p.progress || 0), 0);
    const averageProgress = processes.length > 0 ? Math.round(totalProgress / processes.length) : 0;

    // On-time delivery (processes completed by due date)
    const processesWithDueDate = processes.filter(p => p.dueDate && p.status === 'Completed');
    const onTimeProcesses = processesWithDueDate.filter(p => {
      const dueDate = new Date(p.dueDate);
      const endDate = new Date(p.endDate || p.updatedAt);
      return endDate <= dueDate;
    }).length;
    const onTimeDelivery = processesWithDueDate.length > 0 ? Math.round((onTimeProcesses / processesWithDueDate.length) * 100) : 100;

    // Service utilization (placeholder calculation)
    const totalMonthlyHours = services.reduce((sum, s) => sum + s.monthlyHours, 0);
    const serviceUtilization = totalMonthlyHours > 0 ? Math.min(100, Math.round((totalMonthlyHours / (40 * 4)) * 100)) : 0; // Assuming 40h/week baseline

    return {
      processCompletionRate,
      averageProgress,
      onTimeDelivery,
      serviceUtilization
    };
  }
}

export const reportService = new ReportService();