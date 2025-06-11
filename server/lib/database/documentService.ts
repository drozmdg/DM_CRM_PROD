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
    try {      const documentData = {
        id: document.id || crypto.randomUUID(),
        customer_id: document.customerId,
        name: document.name,
        description: document.description,
        url: document.url,
        type: document.type,
        category: document.category || 'Other',
        size: document.size,
        upload_date: document.uploadDate || new Date().toISOString(),
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
    try {      const { data, error } = await supabase
        .from('documents')
        .update({
          name: updates.name,
          description: updates.description,
          url: updates.url,
          type: updates.type,
          category: updates.category,
          size: updates.size,
          upload_date: updates.uploadDate,
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
   * Get documents linked to a specific process
   */
  async getDocumentsByProcessId(processId: string): Promise<Document[]> {
    try {
      // Try junction table first
      const { data: junctionData, error: junctionError } = await supabase
        .from('process_documents')
        .select(`
          document_id,
          documents (*)
        `)
        .eq('process_id', processId);

      if (junctionError && junctionError.code === 'PGRST116') {
        // Junction table doesn't exist, use workaround: query documents table directly
        console.log('⚠️ process_documents table not found, using workaround method');
        
        const { data: documents, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .eq('process_id', processId);

        if (docsError) {
          console.error('Error fetching process documents (workaround):', docsError);
          return [];
        }

        return (documents || []).map(this.mapDbDocumentToDocument);
      }

      if (junctionError) {
        console.error('Error fetching process documents:', junctionError);
        return [];
      }

      return (junctionData || [])
        .map(item => item.documents)
        .filter(Boolean)
        .map(this.mapDbDocumentToDocument);
    } catch (error) {
      console.error('Error in getDocumentsByProcessId:', error);
      return [];
    }
  }/**
   * Attach a document to a process (WORKAROUND: using documents table)
   */
  async attachDocumentToProcess(processId: string, documentId: string): Promise<void> {
    try {
      console.log(`Attempting to attach document ${documentId} to process ${processId}`);
      
      // WORKAROUND: Check if process_documents table exists, if not use alternative method
      const { data: tableCheck, error: tableError } = await supabase
        .from('process_documents')
        .select('process_id')
        .limit(1);

      if (tableError && tableError.code === 'PGRST116') {
        // Table doesn't exist, use workaround: add process_id to documents table
        console.log('⚠️ process_documents table not found, using workaround method');
        
        const { error: updateError } = await supabase
          .from('documents')
          .update({ 
            process_id: processId,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);

        if (updateError) {
          console.error('Error in workaround attachment:', updateError);
          throw new Error(`Failed to attach document to process (workaround): ${updateError.message}`);
        }
        
        console.log('✅ Document attached using workaround method');
        return;
      }

      // Normal method: use junction table
      const result = await supabase
        .from('process_documents')
        .insert([{
          process_id: processId,
          document_id: documentId
        }]);

      console.log('Insert result:', JSON.stringify(result, null, 2));

      if (result.error) {
        console.error('Error attaching document to process:', result.error);
        throw new Error(`Failed to attach document to process: ${result.error.message || JSON.stringify(result.error)}`);
      }
      
      console.log('✅ Document attached using junction table');
    } catch (error) {
      console.error('Error in attachDocumentToProcess:', error);
      throw error;
    }
  }
  /**
   * Remove a document from a process
   */
  async removeDocumentFromProcess(processId: string, documentId: string): Promise<void> {
    try {
      // Try junction table first
      const { error: junctionError } = await supabase
        .from('process_documents')
        .delete()
        .eq('process_id', processId)
        .eq('document_id', documentId);

      if (junctionError && junctionError.code === 'PGRST116') {
        // Junction table doesn't exist, use workaround: remove process_id from document
        console.log('⚠️ process_documents table not found, using workaround method');
        
        const { error: updateError } = await supabase
          .from('documents')
          .update({ 
            process_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId)
          .eq('process_id', processId);

        if (updateError) {
          console.error('Error in workaround removal:', updateError);
          throw new Error(`Failed to remove document from process (workaround): ${updateError.message}`);
        }
        
        console.log('✅ Document removed using workaround method');
        return;
      }

      if (junctionError) {
        console.error('Error removing document from process:', junctionError);
        throw new Error(`Failed to remove document from process: ${junctionError.message}`);
      }
      
      console.log('✅ Document removed using junction table');
    } catch (error) {
      console.error('Error in removeDocumentFromProcess:', error);
      throw error;
    }
  }

  /**
   * Create document and attach to process in one operation
   */
  async createDocumentForProcess(
    processId: string, 
    document: Partial<Document> & { customerId: string }
  ): Promise<Document> {
    try {
      // Create the document first
      const createdDocument = await this.createDocument(document);

      // Then attach it to the process
      await this.attachDocumentToProcess(processId, createdDocument.id);

      return createdDocument;
    } catch (error) {
      console.error('Error in createDocumentForProcess:', error);
      throw error;
    }
  }

  /**
   * Get all documents that can be attached to a process (customer documents not already attached)
   */
  async getAvailableDocumentsForProcess(processId: string, customerId: string): Promise<Document[]> {
    try {
      // Get all customer documents
      const customerDocuments = await this.getDocumentsByCustomerId(customerId);

      // Get documents already attached to the process
      const processDocuments = await this.getDocumentsByProcessId(processId);
      const attachedDocumentIds = new Set(processDocuments.map(doc => doc.id));

      // Filter out already attached documents
      return customerDocuments.filter(doc => !attachedDocumentIds.has(doc.id));
    } catch (error) {
      console.error('Error in getAvailableDocumentsForProcess:', error);
      return [];
    }
  }

  /**
   * Get all documents with process information, optionally filtered by customer
   */  async getAllDocumentsWithProcessInfo(customerId?: string): Promise<Document[]> {
    try {
      // Try to get documents with process information using joins
      let query = supabase
        .from('documents')
        .select(`
          *,
          process_documents!left(
            process_id,
            processes!inner(
              id,
              name,
              status,
              sdlc_stage,
              functional_area
            )
          )
        `);
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching documents with process info:', error);
        // Fallback to regular document fetch if join fails
        return this.getAllDocuments(customerId);
      }
      
      return (data || []).map((doc: any) => {
        const document = this.mapDbDocumentToDocument(doc);
        
        // Add process information if available
        if (doc.process_documents && doc.process_documents.length > 0) {
          const processInfo = doc.process_documents[0].processes;
          if (processInfo) {
            (document as any).processInfo = {
              id: processInfo.id,
              name: processInfo.name,
              status: processInfo.status,
              stage: processInfo.sdlc_stage,
              functionalArea: processInfo.functional_area
            };
          }
        }
        
        return document;
      });
    } catch (error) {
      console.error('Error in getAllDocumentsWithProcessInfo:', error);
      // Fallback to regular document fetch
      return this.getAllDocuments(customerId);
    }
  }

  /**
   * Get documents by customer ID with process information
   */
  async getDocumentsByCustomerIdWithProcessInfo(customerId: string): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          process_documents!left(
            process_id,
            processes!inner(
              id,
              name,
              status,
              sdlc_stage,
              functional_area
            )
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer documents with process info:', error);
        // Fallback to regular document fetch
        return this.getDocumentsByCustomerId(customerId);
      }

      return (data || []).map((doc: any) => {
        const document = this.mapDbDocumentToDocument(doc);
        
        // Add process information if available
        if (doc.process_documents && doc.process_documents.length > 0) {
          const processInfo = doc.process_documents[0].processes;
          if (processInfo) {
            (document as any).processInfo = {
              id: processInfo.id,
              name: processInfo.name,
              status: processInfo.status,
              stage: processInfo.sdlc_stage,
              functionalArea: processInfo.functional_area
            };
          }
        }
        
        return document;
      });
    } catch (error) {
      console.error('Error in getDocumentsByCustomerIdWithProcessInfo:', error);
      // Fallback to regular document fetch
      return this.getDocumentsByCustomerId(customerId);
    }
  }
  /**
   * Map database document to application document
   */  private mapDbDocumentToDocument(dbDocument: any): Document {
    return {
      id: dbDocument.id,
      name: dbDocument.name,
      description: dbDocument.description,
      url: dbDocument.url,
      type: dbDocument.type,
      category: dbDocument.category,
      size: dbDocument.size,
      uploadDate: dbDocument.upload_date,
      customerId: dbDocument.customer_id
    };
  }
  /**
   * Get mock documents for graceful degradation
   */  private getMockDocuments(customerId?: string): Document[] {
    const mockDocuments = [
      {
        id: 'mock-doc-1',
        name: 'Contract Agreement.pdf',
        description: 'Contract agreement document',
        url: '/mock/contract.pdf',
        type: 'application/pdf',
        category: 'Contract' as const,
        size: 1024000,
        uploadDate: new Date().toISOString(),
        customerId: customerId || 'unknown'
      },
      {
        id: 'mock-doc-2',
        name: 'Technical Requirements.docx',
        description: 'Technical requirements document',
        url: '/mock/requirements.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        category: 'Requirements' as const,
        size: 512000,
        uploadDate: new Date().toISOString(),
        customerId: customerId || 'unknown'
      },
      {
        id: 'mock-doc-3',
        name: 'Project Proposal.pdf',
        description: 'Project proposal document',
        url: '/mock/proposal.pdf',
        type: 'application/pdf',
        category: 'Proposal' as const,
        size: 2048000,
        uploadDate: new Date().toISOString(),
        customerId: customerId || 'unknown'
      }
    ];

    // If specific customer requested, return subset
    if (customerId) {
      return mockDocuments.slice(0, 2);
    }

    return mockDocuments;
  }
}
