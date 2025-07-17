import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContactService } from '../../server/lib/database/contactService.js';
import { supabase } from '../../server/lib/supabase.js';
import type { Contact } from '../../shared/types/index.js';

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
    order: vi.fn().mockReturnThis()
  }
}));

describe('ContactService', () => {
  let contactService: ContactService;

  beforeEach(() => {
    contactService = new ContactService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllContacts', () => {
    it('should return all contacts when no customerId provided', async () => {
      const mockContacts = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          role: 'Manager',
          type: 'External',
          customer_id: 'customer-1',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+0987654321',
          role: 'Developer',
          type: 'Internal',
          customer_id: null,
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      // Mock successful response
      (supabase.order as any).mockResolvedValue({
        data: mockContacts,
        error: null
      });

      const result = await contactService.getAllContacts();

      expect(result).toHaveLength(2);
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when database error occurs', async () => {
      // Mock error response
      (supabase.order as any).mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await contactService.getAllContacts();

      expect(result).toEqual([]);
    });

    it('should handle exceptions gracefully', async () => {
      // Mock exception
      (supabase.order as any).mockRejectedValue(new Error('Database connection failed'));

      const result = await contactService.getAllContacts();

      expect(result).toEqual([]);
    });

    it('should return contacts for specific customer when customerId provided', async () => {
      const customerId = 'customer-1';
      const mockDirectContacts = [
        {
          id: '1',
          name: 'Direct Contact',
          email: 'direct@example.com',
          type: 'External',
          customer_id: customerId
        }
      ];

      const mockAssignedContacts = [
        {
          contact_id: '2',
          contacts: {
            id: '2',
            name: 'Assigned Internal',
            email: 'internal@example.com',
            type: 'Internal',
            customer_id: null
          }
        }
      ];

      // Mock Promise.all responses
      const mockPromiseAll = vi.fn().mockResolvedValue([
        { data: mockDirectContacts, error: null },
        { data: mockAssignedContacts, error: null }
      ]);

      // Override Promise.all for this test
      const originalPromiseAll = Promise.all;
      (global as any).Promise.all = mockPromiseAll;

      const result = await contactService.getAllContacts(customerId);

      // Should return both direct and assigned contacts
      expect(result).toHaveLength(2);
      
      // Restore Promise.all
      (global as any).Promise.all = originalPromiseAll;
    });
  });

  describe('getContactById', () => {
    it('should return a contact when found', async () => {
      const mockContact = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Manager',
        type: 'External',
        customer_id: 'customer-1'
      };

      // Mock successful response
      (supabase.single as any).mockResolvedValue({
        data: mockContact,
        error: null
      });

      const result = await contactService.getContactById('1');

      expect(result).toEqual(mockContact);
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
      expect(supabase.single).toHaveBeenCalled();
    });

    it('should return null when contact not found', async () => {
      // Mock error response
      (supabase.single as any).mockResolvedValue({
        data: null,
        error: { message: 'Contact not found' }
      });

      const result = await contactService.getContactById('invalid-id');

      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      // Mock exception
      (supabase.single as any).mockRejectedValue(new Error('Database connection failed'));

      const result = await contactService.getContactById('1');

      expect(result).toBeNull();
    });
  });

  describe('createContact', () => {
    it('should create a contact successfully', async () => {
      const newContact: Partial<Contact> = {
        name: 'New Contact',
        email: 'new@example.com',
        phone: '+1111111111',
        role: 'Developer',
        type: 'External',
        customer_id: 'customer-1'
      };

      const mockCreatedContact = {
        id: 'generated-id',
        ...newContact,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock successful response
      (supabase.single as any).mockResolvedValue({
        data: mockCreatedContact,
        error: null
      });

      const result = await contactService.createContact(newContact);

      expect(result).toEqual(mockCreatedContact);
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(supabase.insert).toHaveBeenCalled();
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      const newContact: Partial<Contact> = {
        name: 'New Contact',
        email: 'new@example.com'
      };

      // Mock error response
      (supabase.single as any).mockResolvedValue({
        data: null,
        error: { message: 'Duplicate email' }
      });

      await expect(contactService.createContact(newContact))
        .rejects.toThrow('Failed to create contact: Duplicate email');
    });
  });

  describe('updateContact', () => {
    it('should update a contact successfully', async () => {
      const updates: Partial<Contact> = {
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '+9999999999'
      };

      const mockUpdatedContact = {
        id: '1',
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '+9999999999',
        role: 'Manager',
        type: 'External',
        customer_id: 'customer-1',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock successful response
      (supabase.single as any).mockResolvedValue({
        data: mockUpdatedContact,
        error: null
      });

      const result = await contactService.updateContact('1', updates);

      expect(result).toEqual(mockUpdatedContact);
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(supabase.update).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      const updates: Partial<Contact> = {
        name: 'Updated Name'
      };

      // Mock error response
      (supabase.single as any).mockResolvedValue({
        data: null,
        error: { message: 'Contact not found' }
      });

      await expect(contactService.updateContact('invalid-id', updates))
        .rejects.toThrow('Failed to update contact: Contact not found');
    });
  });

  describe('deleteContact', () => {
    it('should delete a contact successfully', async () => {
      // Mock successful response
      (supabase.delete as any).mockResolvedValue({
        error: null
      });

      await expect(contactService.deleteContact('1')).resolves.toBeUndefined();

      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw error when deletion fails', async () => {
      // Mock error response
      (supabase.delete as any).mockResolvedValue({
        error: { message: 'Contact not found' }
      });

      await expect(contactService.deleteContact('invalid-id'))
        .rejects.toThrow('Failed to delete contact: Contact not found');
    });
  });

  describe('internal contact assignment methods', () => {
    it('should get internal contacts successfully', async () => {
      const mockInternalContacts = [
        {
          id: '1',
          name: 'Internal User 1',
          email: 'internal1@company.com',
          type: 'Internal',
          customer_id: null
        },
        {
          id: '2',
          name: 'Internal User 2',
          email: 'internal2@company.com',
          type: 'Internal',
          customer_id: null
        }
      ];

      (supabase.order as any).mockResolvedValue({
        data: mockInternalContacts,
        error: null
      });

      const result = await contactService.getInternalContacts();

      expect(result).toEqual(mockInternalContacts);
      expect(supabase.eq).toHaveBeenCalledWith('type', 'Internal');
    });

    it('should assign contact to customer successfully', async () => {
      const assignmentData = {
        contact_id: 'contact-1',
        customer_id: 'customer-1',
        assigned_by: 'user-1',
        assigned_at: '2024-01-01T00:00:00Z'
      };

      (supabase.single as any).mockResolvedValue({
        data: assignmentData,
        error: null
      });

      const result = await contactService.assignContactToCustomer('contact-1', 'customer-1', 'user-1');

      expect(result).toEqual(assignmentData);
      expect(supabase.from).toHaveBeenCalledWith('contact_customer_assignments');
      expect(supabase.insert).toHaveBeenCalled();
    });

    it('should remove contact assignment successfully', async () => {
      (supabase.delete as any).mockResolvedValue({
        error: null
      });

      await expect(contactService.removeContactFromCustomer('contact-1', 'customer-1'))
        .resolves.toBeUndefined();

      expect(supabase.from).toHaveBeenCalledWith('contact_customer_assignments');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('contact_id', 'contact-1');
      expect(supabase.eq).toHaveBeenCalledWith('customer_id', 'customer-1');
    });
  });
});