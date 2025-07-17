/**
 * Contact Service - Handles all contact-related database operations
 */

import { supabase } from '../supabase.js';
import type { Contact, Communication } from '../../../shared/types/index.js';

export class ContactService {
  /**
   * Get all contacts, optionally filtered by customer
   * For customer filtering, this includes both direct contacts and assigned internal contacts
   */
  async getAllContacts(customerId?: string): Promise<Contact[]> {
    try {
      if (customerId) {
        // Get both direct contacts and assigned internal contacts for a customer
        const [directContacts, assignedContacts] = await Promise.all([
          // Direct contacts
          supabase
            .from('contacts')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false }),
          // Internal contacts assigned to this customer
          supabase
            .from('contact_customer_assignments')
            .select(`
              contact_id,
              contacts!inner(*)
            `)
            .eq('customer_id', customerId)
            .eq('contacts.type', 'Internal')
        ]);

        if (directContacts.error) {
          console.error('Error fetching direct contacts:', directContacts.error);
          return [];
        }

        if (assignedContacts.error) {
          console.error('Error fetching assigned contacts:', assignedContacts.error);
          // Continue with just direct contacts if assignments fail
        }

        // Combine and deduplicate contacts
        const allContacts = [
          ...(directContacts.data || []).map(this.mapDbContactToContact),
          ...(assignedContacts.data || []).map((assignment: any) => 
            this.mapDbContactToContact(assignment.contacts)
          )
        ];

        // Remove duplicates by ID
        const uniqueContacts = Array.from(
          new Map(allContacts.map(contact => [contact.id, contact])).values()
        );

        return uniqueContacts;
      } else {
        // Get all contacts
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching contacts:', error);
          return [];
        }
        
        return (data || []).map(this.mapDbContactToContact);
      }
    } catch (error) {
      console.error('Error in getAllContacts:', error);
      return [];
    }
  }

  /**
   * Get a specific contact by ID
   */
  async getContactById(id: string): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching contact:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getContactById:', error);
      return null;
    }
  }

  /**
   * Create a new contact
   */
  async createContact(contact: Partial<Contact>): Promise<Contact> {
    try {
      const contactData = {
        id: contact.id || crypto.randomUUID(),
        customer_id: contact.type === 'Internal' ? null : contact.customerId,
        name: contact.name || '',
        title: contact.title || null,
        email: contact.email || null,
        phone: contact.phone || null,
        role: contact.role || null,
        type: contact.type || 'Client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating contact:', error);
        throw new Error(`Failed to create contact: ${error.message}`);
      }
      
      return this.mapDbContactToContact(data);
    } catch (error) {
      console.error('Error in createContact:', error);
      // Return a mock contact as fallback
      return {
        id: contact.id || crypto.randomUUID(),
        customerId: contact.customerId || '',
        name: contact.name || '',
        title: contact.title || null,
        email: contact.email || null,
        phone: contact.phone || null,
        role: contact.role || null,
        type: contact.type || 'Client'
      };
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.type !== undefined) updateData.type = updates.type;

      const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating contact:', error);
        throw new Error(`Failed to update contact: ${error.message}`);
      }
      
      return this.mapDbContactToContact(data);
    } catch (error) {
      console.error('Error in updateContact:', error);
      throw error;
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting contact:', error);
        throw new Error(`Failed to delete contact: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteContact:', error);
      throw error;
    }  }
  /**
   * Get all communications for a contact
   */
  async getCommunications(contactId: string): Promise<Communication[]> {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching communications:', error);
        throw error; // Throw error instead of returning empty array to trigger fallback
      }
      
      return (data || []).map(this.mapDbCommunicationToCommunication);
    } catch (error) {
      console.error('Error in getCommunications:', error);
      throw error; // Re-throw error to trigger fallback mechanism
    }
  }

  /**
   * Get a specific communication by ID
   */
  async getCommunication(id: string): Promise<Communication | undefined> {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching communication:', error);
        return undefined;
      }
      
      return data ? this.mapDbCommunicationToCommunication(data) : undefined;
    } catch (error) {
      console.error('Error in getCommunication:', error);
      return undefined;
    }
  }
  /**
   * Create a new communication
   */
  async createCommunication(communication: Omit<Communication, 'id' | 'createdAt'>): Promise<Communication> {
    try {
      const { data, error } = await supabase
        .from('communications')
        .insert({
          contact_id: communication.contactId,
          type: communication.type,
          subject: communication.subject,
          notes: communication.notes,
          date: communication.date,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating communication:', error);
        throw error; // Throw error to trigger fallback mechanism
      }
      
      return this.mapDbCommunicationToCommunication(data);
    } catch (error) {
      console.error('Error in createCommunication:', error);
      throw error; // Re-throw error to trigger fallback
    }
  }

  /**
   * Update an existing communication
   */
  async updateCommunication(id: string, updates: Partial<Communication>): Promise<Communication> {
    try {
      const dbUpdates: any = {};
      
      if (updates.contactId) dbUpdates.contact_id = updates.contactId;
      if (updates.type) dbUpdates.type = updates.type;
      if (updates.subject) dbUpdates.subject = updates.subject;
      if (updates.notes) dbUpdates.notes = updates.notes;
      if (updates.date) dbUpdates.date = updates.date;
      
      const { data, error } = await supabase
        .from('communications')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating communication:', error);
        throw error;
      }
      
      return this.mapDbCommunicationToCommunication(data);
    } catch (error) {
      console.error('Error in updateCommunication:', error);
      throw error;
    }
  }

  /**
   * Delete a communication
   */
  async deleteCommunication(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('communications')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting communication:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteCommunication:', error);
      throw error;
    }
  }
  /**
   * Map database contact to application contact
   */
  private mapDbContactToContact(dbContact: any): Contact {
    return {
      id: dbContact.id,
      customerId: dbContact.customer_id,
      name: dbContact.name,
      title: dbContact.title,
      email: dbContact.email,
      phone: dbContact.phone,
      role: dbContact.role,
      type: dbContact.type
    };
  }

  /**
   * Map database communication to application communication
   */
  private mapDbCommunicationToCommunication(dbCommunication: any): Communication {
    return {
      id: dbCommunication.id,
      contactId: dbCommunication.contact_id,
      type: dbCommunication.type,
      subject: dbCommunication.subject,
      notes: dbCommunication.notes,
      date: dbCommunication.date,
      createdAt: dbCommunication.created_at
    };
  }

  /**
   * Get all internal contacts (includes both unassigned and assigned)
   */
  async getInternalContacts(): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('type', 'Internal')
        .order('name');
      
      if (error) {
        console.error('Error fetching internal contacts:', error);
        return [];
      }
      
      const contacts = (data || []).map(this.mapDbContactToContact);
      console.log('getInternalContacts found:', contacts.length, 'internal contacts');
      return contacts;
    } catch (error) {
      console.error('Error in getInternalContacts:', error);
      return [];
    }
  }

  /**
   * Get all customers assigned to an internal contact
   */
  async getContactAssignments(contactId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('contact_customer_assignments')
        .select('customer_id')
        .eq('contact_id', contactId);
      
      if (error) {
        console.error('Error fetching contact assignments:', error);
        return [];
      }
      
      return (data || []).map(assignment => assignment.customer_id);
    } catch (error) {
      console.error('Error in getContactAssignments:', error);
      return [];
    }
  }

  /**
   * Assign an internal contact to a customer
   */
  async assignContactToCustomer(contactId: string, customerId: string): Promise<void> {
    try {
      // First verify the contact is Internal type and get current customer_id
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('type, customer_id')
        .eq('id', contactId)
        .single();
      
      if (contactError || !contact) {
        throw new Error('Contact not found');
      }
      
      if (contact.type !== 'Internal') {
        throw new Error('Only Internal contacts can be assigned to multiple customers');
      }

      // If the contact has a customer_id (legacy), migrate it to the assignment table first
      if (contact.customer_id) {
        console.log(`Migrating internal contact ${contactId} from customer_id to assignment table`);
        
        // Create assignment for the current customer_id
        await supabase
          .from('contact_customer_assignments')
          .insert({
            contact_id: contactId,
            customer_id: contact.customer_id,
            assigned_at: new Date().toISOString()
          })
          .select();
        
        // Clear the customer_id from the contact
        await supabase
          .from('contacts')
          .update({ customer_id: null })
          .eq('id', contactId);
      }

      // Create the new assignment
      const { error } = await supabase
        .from('contact_customer_assignments')
        .insert({
          contact_id: contactId,
          customer_id: customerId,
          assigned_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        // Ignore conflict errors (already assigned)
        if (!error.message.includes('duplicate key')) {
          console.error('Error assigning contact to customer:', error);
          throw new Error(`Failed to assign contact: ${error.message}`);
        }
      }
      
      console.log(`Successfully assigned internal contact ${contactId} to customer ${customerId}`);
    } catch (error) {
      console.error('Error in assignContactToCustomer:', error);
      throw error;
    }
  }

  /**
   * Unassign an internal contact from a customer
   */
  async unassignContactFromCustomer(contactId: string, customerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contact_customer_assignments')
        .delete()
        .eq('contact_id', contactId)
        .eq('customer_id', customerId);
      
      if (error) {
        console.error('Error unassigning contact from customer:', error);
        throw new Error(`Failed to unassign contact: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in unassignContactFromCustomer:', error);
      throw error;
    }
  }
}
