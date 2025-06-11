/**
 * Contact Service - Handles all contact-related database operations
 */

import { supabase } from '../supabase.js';
import type { Contact, Communication } from '../../../shared/types/index.js';

export class ContactService {
  /**
   * Get all contacts, optionally filtered by customer
   */
  async getAllContacts(customerId?: string): Promise<Contact[]> {
    try {
      let query = supabase.from('contacts').select('*');
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
        const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching contacts:', error);
        return [];
      }
      
      return (data || []).map(this.mapDbContactToContact);
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
        customer_id: contact.customerId,
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
}
