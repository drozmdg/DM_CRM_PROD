/**
 * Document Service - Handles all document-related database operations
 */

import { supabase } from '../supabase.js';
import type { Document } from '../../../shared/types/index.js';

export class DocumentService {
  /**
   * Get all documents, optionally filtered by customer
   */
  async getAllDocuments(customerId?: string): Promise<Document[]> {
    try {
      let query = supabase.from('documents').select('*');
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching documents:', error);
        // Return mock data for graceful degradation
        return this.getMockDocuments(customerId);
      }
      
      return (data || []).map(this.mapDbDocumentToDocument);
    } catch (error) {
      console.error('Error in getAllDocuments:', error);
      return this.getMockDocuments(customerId);
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocumentById(id: string): Promise<Document | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching document:', error);
        return null;
      }
      
      return this.mapDbDocumentToDocument(data);
    } catch (error) {
      console.error('Error in getDocumentById:', error);
      return null;
    }
  }

  /**
   * Get documents by customer ID
   */
  async getDocumentsByCustomerId(customerId: string): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents by customer:', error);
        return this.getMockDocuments(customerId);
      }

      return (data || []).map(this.mapDbDocumentToDocument);
    } catch (error) {
      console.error('Error in getDocumentsByCustomerId:', error);
      return this.getMockDocuments(customerId);
    }
  }

  /**
   * Create a new document
   */
  async createDocument(document: Partial<Document> & { customerId: string }): Promise<Document> {
    try {
      const documentData = {
        id: document.id || crypto.randomUUID(),
        customer_id: document.customerId,
        name: document.name,
        url: document.url,
        category: document.category || 'Other',
        size: document.size,
        uploaded_date: document.uploadedDate || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating document:', error);
        throw new Error(`Failed to create document: ${error.message}`);
      }
      
      return this.mapDbDocumentToDocument(data);
    } catch (error) {
      console.error('Error in createDocument:', error);
      throw error;
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          name: updates.name,
          url: updates.url,
          category: updates.category,
          size: updates.size,
          uploaded_date: updates.uploadedDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating document:', error);
        throw new Error(`Failed to update document: ${error.message}`);
      }
      
      return this.mapDbDocumentToDocument(data);
    } catch (error) {
      console.error('Error in updateDocument:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting document:', error);
        throw new Error(`Failed to delete document: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  }

  /**
   * Get document metrics
   */
  async getDocumentMetrics(): Promise<{
    total: number;
    totalSize: number;
    byCategory: Record<string, number>;
    byCustomer: Record<string, number>;
  }> {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select(`
          *,
          customers!inner (
            id,
            name
          )
        `);

      if (error) throw error;

      const total = documents.length;
      let totalSize = 0;
      const byCategory: Record<string, number> = {};
      const byCustomer: Record<string, number> = {};

      documents.forEach(doc => {
        totalSize += doc.size || 0;
        
        // Count by category
        byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
        
        // Count by customer
        const customerName = (doc as any).customers.name;
        byCustomer[customerName] = (byCustomer[customerName] || 0) + 1;
      });

      return {
        total,
        totalSize,
        byCategory,
        byCustomer
      };
    } catch (error) {
      console.error('Error getting document metrics:', error);
      return {
        total: 0,
        totalSize: 0,
        byCategory: {},
        byCustomer: {}
      };
    }
  }

  /**
   * Map database document to application document
   */
  private mapDbDocumentToDocument(dbDocument: any): Document {
    return {
      id: dbDocument.id,
      name: dbDocument.name,
      url: dbDocument.url,
      category: dbDocument.category,
      size: dbDocument.size,
      uploadedDate: dbDocument.uploaded_date
    };
  }

  /**
   * Get mock documents for graceful degradation
   */
  private getMockDocuments(customerId?: string): Document[] {
    const mockDocuments = [
      {
        id: 'mock-doc-1',
        name: 'Contract Agreement.pdf',
        url: '/mock/contract.pdf',
        category: 'Contract' as const,
        size: 1024000,
        uploadedDate: new Date().toISOString()
      },
      {
        id: 'mock-doc-2',
        name: 'Technical Requirements.docx',
        url: '/mock/requirements.docx',
        category: 'Requirements' as const,
        size: 512000,
        uploadedDate: new Date().toISOString()
      },
      {
        id: 'mock-doc-3',
        name: 'Project Proposal.pdf',
        url: '/mock/proposal.pdf',
        category: 'Proposal' as const,
        size: 2048000,
        uploadedDate: new Date().toISOString()
      }
    ];

    // If specific customer requested, return subset
    if (customerId) {
      return mockDocuments.slice(0, 2);
    }

    return mockDocuments;
  }
}
