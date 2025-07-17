import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DocumentService } from '../../server/lib/database/documentService.js';
import { supabase } from '../../server/lib/supabase.js';
import type { Document } from '../../shared/types/index.js';

// Mock the Supabase client
vi.mock('../../server/lib/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn()
    }
  }
}));

describe('DocumentService', () => {
  let documentService: DocumentService;

  beforeEach(() => {
    documentService = new DocumentService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllDocuments', () => {
    it('should return all documents when no customerId provided', async () => {
      const mockDocuments = [
        {
          id: '1',
          title: 'Document 1',
          description: 'Test document 1',
          type: 'PDF',
          customer_id: 'customer-1',
          file_path: '/documents/doc1.pdf',
          file_size: 1024,
          category: 'Contract',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'Document 2',
          description: 'Test document 2',
          type: 'DOCX',
          customer_id: 'customer-2',
          file_path: '/documents/doc2.docx',
          file_size: 2048,
          category: 'Report',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];

      // Mock successful response
      (supabase.order as any).mockResolvedValue({
        data: mockDocuments,
        error: null
      });

      const result = await documentService.getAllDocuments();

      expect(result).toHaveLength(2);
      expect(supabase.from).toHaveBeenCalledWith('documents');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return filtered documents when customerId provided', async () => {
      const customerId = 'customer-1';
      const mockDocuments = [
        {
          id: '1',
          title: 'Customer 1 Document',
          description: 'Document for customer 1',
          type: 'PDF',
          customer_id: customerId,
          file_path: '/documents/customer1-doc.pdf',
          file_size: 1024,
          category: 'Contract'
        }
      ];

      // Mock successful response
      (supabase.order as any).mockResolvedValue({
        data: mockDocuments,
        error: null
      });

      const result = await documentService.getAllDocuments(customerId);

      expect(result).toHaveLength(1);
      expect(result[0].customer_id).toBe(customerId);
      expect(supabase.eq).toHaveBeenCalledWith('customer_id', customerId);
    });

    it('should return mock documents when database error occurs', async () => {
      // Mock error response
      (supabase.order as any).mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await documentService.getAllDocuments();

      expect(Array.isArray(result)).toBe(true);
      // Should return mock data for graceful degradation
    });

    it('should handle exceptions gracefully', async () => {
      // Mock exception
      (supabase.order as any).mockRejectedValue(new Error('Database connection failed'));

      const result = await documentService.getAllDocuments();

      expect(Array.isArray(result)).toBe(true);
      // Should return mock data for graceful degradation
    });
  });

  describe('getDocumentById', () => {
    it('should return a document when found', async () => {
      const mockDocument = {
        id: '1',
        title: 'Test Document',
        description: 'A test document',
        type: 'PDF',
        customer_id: 'customer-1',
        file_path: '/documents/test.pdf',
        file_size: 1024,
        category: 'Contract',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock successful response
      (supabase.single as any).mockResolvedValue({
        data: mockDocument,
        error: null
      });

      const result = await documentService.getDocumentById('1');

      expect(result).toEqual(expect.objectContaining({
        id: '1',
        title: 'Test Document',
        type: 'PDF'
      }));
      expect(supabase.from).toHaveBeenCalledWith('documents');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
      expect(supabase.single).toHaveBeenCalled();
    });

    it('should return null when document not found', async () => {
      // Mock error response
      (supabase.single as any).mockResolvedValue({
        data: null,
        error: { message: 'Document not found' }
      });

      const result = await documentService.getDocumentById('invalid-id');

      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      // Mock exception
      (supabase.single as any).mockRejectedValue(new Error('Database connection failed'));

      const result = await documentService.getDocumentById('1');

      expect(result).toBeNull();
    });
  });

  describe('getDocumentsByCustomerId', () => {
    it('should return documents for specific customer', async () => {
      const customerId = 'customer-1';
      const mockDocuments = [
        {
          id: '1',
          title: 'Customer Document 1',
          description: 'First document for customer',
          type: 'PDF',
          customer_id: customerId,
          file_path: '/documents/customer-doc1.pdf',
          file_size: 1024,
          category: 'Contract'
        },
        {
          id: '2',
          title: 'Customer Document 2',
          description: 'Second document for customer',
          type: 'DOCX',
          customer_id: customerId,
          file_path: '/documents/customer-doc2.docx',
          file_size: 2048,
          category: 'Report'
        }
      ];

      // Mock successful response
      (supabase.order as any).mockResolvedValue({
        data: mockDocuments,
        error: null
      });

      const result = await documentService.getDocumentsByCustomerId(customerId);

      expect(result).toHaveLength(2);
      expect(result.every(doc => doc.customer_id === customerId)).toBe(true);
      expect(supabase.eq).toHaveBeenCalledWith('customer_id', customerId);
      expect(supabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return mock data when database error occurs', async () => {
      const customerId = 'customer-1';

      // Mock error response
      (supabase.order as any).mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await documentService.getDocumentsByCustomerId(customerId);

      expect(Array.isArray(result)).toBe(true);
      // Should return mock data for graceful degradation
    });
  });

  describe('createDocument', () => {
    it('should create a document successfully', async () => {
      const newDocument: Partial<Document> = {
        title: 'New Document',
        description: 'A new test document',
        type: 'PDF',
        customer_id: 'customer-1',
        file_path: '/documents/new.pdf',
        file_size: 1024,
        category: 'Contract'
      };

      const mockCreatedDocument = {
        id: 'generated-id',
        ...newDocument,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock successful response
      (supabase.single as any).mockResolvedValue({
        data: mockCreatedDocument,
        error: null
      });

      const result = await documentService.createDocument(newDocument);

      expect(result).toEqual(expect.objectContaining({
        title: 'New Document',
        type: 'PDF',
        customer_id: 'customer-1'
      }));
      expect(supabase.from).toHaveBeenCalledWith('documents');
      expect(supabase.insert).toHaveBeenCalled();
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      const newDocument: Partial<Document> = {
        title: 'New Document',
        type: 'PDF'
      };

      // Mock error response
      (supabase.single as any).mockResolvedValue({
        data: null,
        error: { message: 'Invalid data' }
      });

      await expect(documentService.createDocument(newDocument))
        .rejects.toThrow('Failed to create document: Invalid data');
    });
  });

  describe('updateDocument', () => {
    it('should update a document successfully', async () => {
      const updates: Partial<Document> = {
        title: 'Updated Document Title',
        description: 'Updated description',
        category: 'Updated Category'
      };

      const mockUpdatedDocument = {
        id: '1',
        title: 'Updated Document Title',
        description: 'Updated description',
        type: 'PDF',
        customer_id: 'customer-1',
        file_path: '/documents/doc.pdf',
        file_size: 1024,
        category: 'Updated Category',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock successful response
      (supabase.single as any).mockResolvedValue({
        data: mockUpdatedDocument,
        error: null
      });

      const result = await documentService.updateDocument('1', updates);

      expect(result).toEqual(expect.objectContaining({
        id: '1',
        title: 'Updated Document Title',
        description: 'Updated description',
        category: 'Updated Category'
      }));
      expect(supabase.from).toHaveBeenCalledWith('documents');
      expect(supabase.update).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      const updates: Partial<Document> = {
        title: 'Updated Title'
      };

      // Mock error response
      (supabase.single as any).mockResolvedValue({
        data: null,
        error: { message: 'Document not found' }
      });

      await expect(documentService.updateDocument('invalid-id', updates))
        .rejects.toThrow('Failed to update document: Document not found');
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      // Mock successful response
      (supabase.delete as any).mockResolvedValue({
        error: null
      });

      await expect(documentService.deleteDocument('1')).resolves.toBeUndefined();

      expect(supabase.from).toHaveBeenCalledWith('documents');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw error when deletion fails', async () => {
      // Mock error response
      (supabase.delete as any).mockResolvedValue({
        error: { message: 'Document not found' }
      });

      await expect(documentService.deleteDocument('invalid-id'))
        .rejects.toThrow('Failed to delete document: Document not found');
    });
  });

  describe('file upload methods', () => {
    it('should handle file upload successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const filePath = 'documents/test.pdf';

      // Mock successful storage upload
      (supabase.storage.upload as any).mockResolvedValue({
        data: { path: filePath },
        error: null
      });

      const result = await documentService.uploadFile(mockFile, filePath);

      expect(result).toEqual({ path: filePath });
      expect(supabase.storage.from).toHaveBeenCalledWith('documents');
      expect(supabase.storage.upload).toHaveBeenCalledWith(filePath, mockFile, {
        cacheControl: '3600',
        upsert: false
      });
    });

    it('should handle file upload errors', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const filePath = 'documents/test.pdf';

      // Mock storage upload error
      (supabase.storage.upload as any).mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' }
      });

      await expect(documentService.uploadFile(mockFile, filePath))
        .rejects.toThrow('Failed to upload file: Upload failed');
    });

    it('should handle file download successfully', async () => {
      const filePath = 'documents/test.pdf';
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });

      // Mock successful storage download
      (supabase.storage.download as any).mockResolvedValue({
        data: mockBlob,
        error: null
      });

      const result = await documentService.downloadFile(filePath);

      expect(result).toBe(mockBlob);
      expect(supabase.storage.from).toHaveBeenCalledWith('documents');
      expect(supabase.storage.download).toHaveBeenCalledWith(filePath);
    });

    it('should handle file download errors', async () => {
      const filePath = 'documents/test.pdf';

      // Mock storage download error
      (supabase.storage.download as any).mockResolvedValue({
        data: null,
        error: { message: 'File not found' }
      });

      await expect(documentService.downloadFile(filePath))
        .rejects.toThrow('Failed to download file: File not found');
    });
  });
});