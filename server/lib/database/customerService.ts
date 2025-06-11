/**
 * Customer Service - Handles all customer-related database operations
 */

import { supabase } from '../supabase.js';
import type { Customer, Team, Contact, Document, Service, TimelineEvent, Project } from '../../../shared/types/index.js';

export class CustomerService {    async getAllCustomers(includeInactive: boolean = false): Promise<Customer[]> {
    try {
      // Build query with optional inactive filter
      let query = supabase
        .from('customers')
        .select(`
          *,
          teams (*),
          contacts (*),
          documents (*),
          services (*),
          timeline_events (*),
          projects (*)
        `)
        .order('name');

      // Filter out inactive customers unless explicitly requested
      if (!includeInactive) {
        query = query.eq('active', true);
      }

      const { data: customers, error } = await query;

      if (error) throw error;

      // Transform database rows to Customer objects
      return customers.map(this.transformCustomerRow);
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select(`
          *,
          teams (*),
          contacts (*),
          documents (*),
          services (*),
          timeline_events (*),
          projects (*),
          processes (
            *,
            process_timeline_events (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!customer) return null;

      return this.transformCustomerRow(customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }
  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    try {
      // Generate customer ID using the pattern found in existing data: c-{timestamp}
      const customerId = `c-${Date.now()}`;
      
      const { data: customer, error } = await supabase
        .from('customers')
        .insert({
          id: customerId,
          name: customerData.name,
          logo: customerData.logo,
          avatar_color: customerData.avatarColor,
          phase: customerData.phase,
          contract_start_date: customerData.contractStartDate,
          contract_end_date: customerData.contractEndDate
        })
        .select()
        .single();

      if (error) throw error;

      // Create related data
      await this.createRelatedData(customer.id, customerData);

      // Return the complete customer with all related data
      return this.getCustomerById(customer.id) as Promise<Customer>;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .update({
          name: updates.name,
          logo: updates.logo,
          avatar_color: updates.avatarColor,
          phase: updates.phase,
          contract_start_date: updates.contractStartDate,
          contract_end_date: updates.contractEndDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Handle related data updates if provided
      if (updates.teams) await this.updateTeams(id, updates.teams);
      if (updates.contacts) await this.updateContacts(id, updates.contacts);
      if (updates.services) await this.updateServices(id, updates.services);

      return this.getCustomerById(id) as Promise<Customer>;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }  async deleteCustomer(id: string): Promise<void> {
    try {
      console.log(`CustomerService.deleteCustomer called with id: ${id}`);
      
      // Perform soft delete by setting active to false and inactivatedAt timestamp
      const { data, error } = await supabase
        .from('customers')
        .update({ 
          active: false, 
          inactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error during soft delete:', error);
        throw error;
      }
      
      console.log('Soft delete successful, updated customer:', data);
    } catch (error) {
      console.error('Error inactivating customer:', error);
      throw error;
    }
  }

  async reactivateCustomer(id: string): Promise<Customer> {
    try {
      // Reactivate customer by setting active to true and clearing inactivatedAt
      const { data: customer, error } = await supabase
        .from('customers')
        .update({ 
          active: true, 
          inactivated_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Return the complete customer with all related data
      return this.getCustomerById(customer.id) as Promise<Customer>;
    } catch (error) {
      console.error('Error reactivating customer:', error);
      throw error;
    }
  }

  private async createRelatedData(customerId: string, customerData: any): Promise<void> {
    // Create teams
    if (customerData.teams?.length) {
      const teamsToInsert = customerData.teams.map((team: Team) => ({
        ...team,
        customer_id: customerId
      }));
      await supabase.from('teams').insert(teamsToInsert);
    }

    // Create contacts
    if (customerData.contacts?.length) {
      const contactsToInsert = customerData.contacts.map((contact: Contact) => ({
        ...contact,
        customer_id: customerId
      }));
      await supabase.from('contacts').insert(contactsToInsert);
    }

    // Create services
    if (customerData.services?.length) {
      const servicesToInsert = customerData.services.map((service: Service) => ({
        ...service,
        customer_id: customerId,
        monthly_hours: service.monthlyHours
      }));
      await supabase.from('services').insert(servicesToInsert);
    }
  }

  private async updateTeams(customerId: string, teams: Team[]): Promise<void> {
    // Delete existing teams
    await supabase.from('teams').delete().eq('customer_id', customerId);
    
    // Insert new teams
    if (teams.length) {
      const teamsToInsert = teams.map(team => ({
        ...team,
        customer_id: customerId,
        finance_code: team.financeCode
      }));
      await supabase.from('teams').insert(teamsToInsert);
    }
  }

  private async updateContacts(customerId: string, contacts: Contact[]): Promise<void> {
    // Delete existing contacts
    await supabase.from('contacts').delete().eq('customer_id', customerId);
    
    // Insert new contacts
    if (contacts.length) {
      const contactsToInsert = contacts.map(contact => ({
        ...contact,
        customer_id: customerId
      }));
      await supabase.from('contacts').insert(contactsToInsert);
    }
  }

  private async updateServices(customerId: string, services: Service[]): Promise<void> {
    // Delete existing services
    await supabase.from('services').delete().eq('customer_id', customerId);
    
    // Insert new services
    if (services.length) {
      const servicesToInsert = services.map(service => ({
        ...service,
        customer_id: customerId,
        monthly_hours: service.monthlyHours
      }));
      await supabase.from('services').insert(servicesToInsert);
    }
  }
  private transformCustomerRow(row: any): Customer {
    return {
      id: row.id,
      name: row.name,
      logo: row.logo,
      avatarColor: row.avatar_color,
      phase: row.phase,
      contractStartDate: row.contract_start_date,
      contractEndDate: row.contract_end_date,
      active: row.active,
      inactivatedAt: row.inactivated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      teams: (row.teams || []).map((team: any) => ({
        id: team.id,
        name: team.name,
        financeCode: team.finance_code
      })),
      contacts: row.contacts || [],
      documents: row.documents || [],
      services: (row.services || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        monthlyHours: service.monthly_hours
      })),
      processes: (row.processes || []).map((process: any) => ({
        ...process,
        sdlcStage: process.sdlc_stage,
        approvalStatus: process.approval_status,
        approvedDate: process.approved_date,
        deployedDate: process.deployed_date,
        supportedTeamIds: process.supported_team_ids,
        functionalArea: process.functional_area,
        documentIds: process.document_ids,
        contactId: process.contact_id,
        outputDeliveryMethod: process.output_delivery_method,
        outputDeliveryDetails: process.output_delivery_details,        timeline: (process.process_timeline_events || []).map((event: any) => ({
          id: event.id,
          date: event.created_at,
          stage: event.event_type,
          description: event.description,
          title: event.title
        }))
      })),      timeline: (row.timeline_events || []).map((event: any) => ({
        id: event.id,
        date: event.created_at,
        title: event.title,
        description: event.description,
        type: event.event_type,
        icon: event.icon,
        metadata: event.metadata
      })),
      projects: row.projects || []
    };
  }
}
