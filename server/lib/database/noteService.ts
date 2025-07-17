/**
 * Note Service - Handles customer notes and important dates database operations
 */

import { supabase } from '../supabase.js';
import type { CustomerNote, CustomerImportantDate } from '../../../shared/types/index.js';

export class NoteService {
  // Customer Notes methods
  async getNotesByCustomerId(customerId: string): Promise<CustomerNote[]> {
    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .eq('active', true) // Only get active notes
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform snake_case to camelCase
      return (data || []).map(this.transformNoteRow);
    } catch (error) {
      console.error('Error fetching customer notes:', error);
      throw error;
    }
  }

  async createNote(customerId: string, noteContent: string): Promise<CustomerNote> {
    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .insert({ 
          customer_id: customerId, 
          note_content: noteContent,
          active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return this.transformNoteRow(data);
    } catch (error) {
      console.error('Error creating customer note:', error);
      throw error;
    }
  }

  async updateNote(id: string, noteContent: string): Promise<CustomerNote> {
    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .update({ 
          note_content: noteContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return this.transformNoteRow(data);
    } catch (error) {
      console.error('Error updating customer note:', error);
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      // Soft delete - set active to false
      const { error } = await supabase
        .from('customer_notes')
        .update({ 
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting customer note:', error);
      throw error;
    }
  }

  // Important Dates methods
  async getImportantDatesByCustomerId(customerId: string): Promise<CustomerImportantDate[]> {
    try {
      const { data, error } = await supabase
        .from('customer_important_dates')
        .select('*')
        .eq('customer_id', customerId)
        .eq('active', true) // Only get active dates
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      // Transform snake_case to camelCase
      return (data || []).map(this.transformImportantDateRow);
    } catch (error) {
      console.error('Error fetching important dates:', error);
      throw error;
    }
  }

  async getUpcomingImportantDates(daysAhead: number = 30): Promise<CustomerImportantDate[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);
      
      const { data, error } = await supabase
        .from('customer_important_dates')
        .select('*')
        .eq('active', true)
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', futureDate.toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(this.transformImportantDateRow);
    } catch (error) {
      console.error('Error fetching upcoming important dates:', error);
      throw error;
    }
  }

  async createImportantDate(customerId: string, description: string, date: string): Promise<CustomerImportantDate> {
    try {
      const { data, error } = await supabase
        .from('customer_important_dates')
        .insert({ 
          customer_id: customerId, 
          description, 
          date,
          active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return this.transformImportantDateRow(data);
    } catch (error) {
      console.error('Error creating important date:', error);
      throw error;
    }
  }

  async updateImportantDate(id: string, description?: string, date?: string): Promise<CustomerImportantDate> {
    try {
      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (description !== undefined) {
        updateData.description = description;
      }
      
      if (date !== undefined) {
        updateData.date = date;
      }
      
      const { data, error } = await supabase
        .from('customer_important_dates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return this.transformImportantDateRow(data);
    } catch (error) {
      console.error('Error updating important date:', error);
      throw error;
    }
  }

  async deleteImportantDate(id: string): Promise<void> {
    try {
      // Soft delete - set active to false
      const { error } = await supabase
        .from('customer_important_dates')
        .update({ 
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting important date:', error);
      throw error;
    }
  }

  // Transform database rows to application objects
  private transformNoteRow(row: any): CustomerNote {
    return {
      id: row.id,
      customerId: row.customer_id,
      noteContent: row.note_content,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private transformImportantDateRow(row: any): CustomerImportantDate {
    return {
      id: row.id,
      customerId: row.customer_id,
      description: row.description,
      date: row.date,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const noteService = new NoteService();