/**
 * Customer Migration Utilities
 *
 * This file contains functions for migrating customer data from localStorage to Supabase.
 */

import { Customer, Team, Service, Process, Contact, Document, TimelineEvent } from '@/types';
import { supabase, getCurrentTimestamp } from '../supabase';
import { MigrationStatus, STORAGE_KEYS } from './types';
import { getLocalStorageData, transformDate, getCurrentDate } from './utils';

/**
 * Transform a customer from the localStorage format to the Supabase format
 * @param customer The customer from localStorage
 * @returns The transformed customer for Supabase
 */
export const transformCustomer = (customer: Customer): any => {
  return {
    id: customer.id,
    name: customer.name,
    logo: customer.logo || null,
    avatar_color: customer.avatarColor || null,
    phase: customer.phase as any, // Type assertion needed due to enum differences
    contract_start_date: transformDate(customer.contractStart),
    contract_end_date: transformDate(customer.contractEnd),
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  };
};

/**
 * Transform teams from the localStorage format to the Supabase format
 * @param teams The teams from localStorage
 * @param customerId The customer ID
 * @returns The transformed teams for Supabase
 */
export const transformTeams = (teams: Team[], customerId: string): any[] => {
  return teams.map(team => ({
    id: team.id,
    customer_id: customerId,
    name: team.name,
    finance_code: team.financeCode,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  }));
};

/**
 * Transform services from the localStorage format to the Supabase format
 * @param services The services from localStorage
 * @param customerId The customer ID
 * @returns The transformed services for Supabase
 */
export const transformServices = (services: Service[], customerId: string): any[] => {
  return services.map(service => ({
    id: service.id,
    customer_id: customerId,
    name: service.name,
    monthly_hours: service.monthlyHours,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  }));
};

/**
 * Transform processes from the localStorage format to the Supabase format
 * @param processes The processes from localStorage
 * @param customerId The customer ID
 * @returns The transformed processes for Supabase
 */
export const transformProcesses = (processes: Process[], customerId: string): any[] => {
  return processes.map(process => ({
    id: process.id,
    customer_id: customerId,
    name: process.name,
    jira_ticket: process.jiraTicket || null,
    status: (process.status || 'Not Started') as any,
    start_date: transformDate(process.startDate) || getCurrentDate(),
    due_date: transformDate(process.dueDate),
    end_date: transformDate(process.endDate),
    sdlc_stage: (process.sdlcStage || 'Requirements') as any,
    estimate: process.estimate || null,
    contact_id: process.contactId && process.contactId !== 'none' ? process.contactId : null,
    output_delivery_method: process.outputDeliveryMethod && process.outputDeliveryMethod !== 'none' ? process.outputDeliveryMethod : null,
    output_delivery_details: process.outputDeliveryDetails || null,
    dev_sprint: process.devSprint || null,
    approval_status: (process.approvalStatus || 'Not Required') as any,
    approved_date: transformDate(process.approvedDate),
    deployed_date: transformDate(process.deployedDate),
    functional_area: process.functionalArea as any || null,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  }));
};

/**
 * Transform contacts from the localStorage format to the Supabase format
 * @param contacts The contacts from localStorage
 * @param customerId The customer ID
 * @returns The transformed contacts for Supabase
 */
export const transformContacts = (contacts: Contact[], customerId: string): any[] => {
  return contacts.map(contact => ({
    id: contact.id,
    customer_id: customerId,
    name: contact.name,
    title: contact.title || null,
    email: contact.email,
    phone: contact.phone || null,
    role: contact.role || null,
    type: contact.type as any,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  }));
};

/**
 * Transform documents from the localStorage format to the Supabase format
 * @param documents The documents from localStorage
 * @param customerId The customer ID
 * @returns The transformed documents for Supabase
 */
export const transformDocuments = (documents: Document[], customerId: string): any[] => {
  return documents.map(document => ({
    id: document.id,
    customer_id: customerId,
    name: document.name,
    description: document.description || null,
    url: document.url,
    upload_date: transformDate(document.uploadDate) || getCurrentDate(),
    type: document.type || null,
    category: document.category as any,
    size: document.size || null,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  }));
};

/**
 * Transform timeline events from the localStorage format to the Supabase format
 * @param events The timeline events from localStorage
 * @param customerId The customer ID
 * @returns The transformed timeline events for Supabase
 */
export const transformTimelineEvents = (events: TimelineEvent[], customerId: string): any[] => {
  return events.map(event => ({
    id: event.id,
    customer_id: customerId,
    date: transformDate(event.date) || getCurrentDate(),
    title: event.title,
    description: event.description || null,
    type: event.type,
    icon: event.icon || null,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  }));
};

/**
 * Migrate customer data from localStorage to Supabase
 * @returns Promise that resolves to a MigrationStatus object
 */
export const migrateCustomerData = async (): Promise<MigrationStatus> => {
  try {
    // Get customers from localStorage
    const customers = getLocalStorageData<Customer[]>(STORAGE_KEYS.CUSTOMERS);

    if (!customers || customers.length === 0) {
      return {
        success: false,
        message: 'No customer data found in localStorage'
      };
    }

    // Initialize counters
    let customersCount = 0;
    let teamsCount = 0;
    let servicesCount = 0;
    let processesCount = 0;
    let contactsCount = 0;
    let documentsCount = 0;
    let timelineEventsCount = 0;

    // Migrate each customer and its related entities
    for (const customer of customers) {
      // Transform and insert customer
      const transformedCustomer = transformCustomer(customer);
      const { error: customerError } = await supabase
        .from('customers')
        .upsert(transformedCustomer);

      if (customerError) {
        console.error('Error inserting customer:', customerError);
        continue;
      }

      customersCount++;

      // Transform and insert teams
      if (customer.teams && customer.teams.length > 0) {
        const transformedTeams = transformTeams(customer.teams, customer.id);
        const { error: teamsError } = await supabase
          .from('teams')
          .upsert(transformedTeams);

        if (teamsError) {
          console.error('Error inserting teams:', teamsError);
        } else {
          teamsCount += transformedTeams.length;
        }
      }

      // Transform and insert services
      if (customer.services && customer.services.length > 0) {
        const transformedServices = transformServices(customer.services, customer.id);
        const { error: servicesError } = await supabase
          .from('services')
          .upsert(transformedServices);

        if (servicesError) {
          console.error('Error inserting services:', servicesError);
        } else {
          servicesCount += transformedServices.length;
        }
      }

      // Transform and insert processes
      if (customer.processes && customer.processes.length > 0) {
        const transformedProcesses = transformProcesses(customer.processes, customer.id);
        const { error: processesError } = await supabase
          .from('processes')
          .upsert(transformedProcesses);

        if (processesError) {
          console.error('Error inserting processes:', processesError);
        } else {
          processesCount += transformedProcesses.length;
        }
      }

      // Transform and insert contacts
      if (customer.contacts && customer.contacts.length > 0) {
        const transformedContacts = transformContacts(customer.contacts, customer.id);
        const { error: contactsError } = await supabase
          .from('contacts')
          .upsert(transformedContacts);

        if (contactsError) {
          console.error('Error inserting contacts:', contactsError);
        } else {
          contactsCount += transformedContacts.length;
        }
      }

      // Transform and insert documents
      if (customer.documents && customer.documents.length > 0) {
        const transformedDocuments = transformDocuments(customer.documents, customer.id);
        const { error: documentsError } = await supabase
          .from('documents')
          .upsert(transformedDocuments);

        if (documentsError) {
          console.error('Error inserting documents:', documentsError);
        } else {
          documentsCount += transformedDocuments.length;
        }
      }

      // Transform and insert timeline events
      if (customer.timeline && customer.timeline.length > 0) {
        const transformedEvents = transformTimelineEvents(customer.timeline, customer.id);
        const { error: eventsError } = await supabase
          .from('timeline_events')
          .upsert(transformedEvents);

        if (eventsError) {
          console.error('Error inserting timeline events:', eventsError);
        } else {
          timelineEventsCount += transformedEvents.length;
        }
      }
    }

    return {
      success: true,
      message: 'Customer data migration completed successfully',
      details: {
        customersCount,
        teamsCount,
        servicesCount,
        processesCount,
        contactsCount,
        documentsCount,
        timelineEventsCount
      }
    };
  } catch (error) {
    console.error('Error migrating customer data:', error);
    return {
      success: false,
      message: 'Error migrating customer data',
      error
    };
  }
};
