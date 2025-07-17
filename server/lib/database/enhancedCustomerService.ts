/**
 * Enhanced Customer Service - Handles customer operations with RLS error handling
 */

import { supabase } from '../supabase.js';
import { handleSupabaseError } from '../supabase.js';
import type { Customer, Team, Contact, Document, Service, TimelineEvent, Project } from '../../../shared/types/index.js';

interface DatabaseResult<T> {
  data: T | null;
  error: string | null;
  code?: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class EnhancedCustomerService {
  
  /**
   * Validate customer data before operations
   */
  private validateCustomer(customer: Partial<Customer>): ValidationResult {
    if (!customer.name?.trim()) {
      return { isValid: false, error: 'Customer name is required' };
    }
    
    if (customer.name.length > 255) {
      return { isValid: false, error: 'Customer name must be less than 255 characters' };
    }
    
    return { isValid: true };
  }

  /**
   * Handle RLS and other database errors consistently
   */
  private handleDatabaseError(error: any, operation: string, customerId?: string): string {
    console.error(`Database error in ${operation}:`, error);
    
    // RLS policy violations
    if (error?.code === '42501' || error?.message?.includes('policy')) {
      return 'You do not have permission to perform this action on this customer';
    }
    
    // Not found errors
    if (error?.code === 'PGRST116' || error?.message?.includes('not found')) {
      return customerId ? `Customer with ID ${customerId} not found` : 'Customer not found';
    }
    
    // Validation errors
    if (error?.code === '23505') {
      return 'A customer with this information already exists';
    }
    
    if (error?.code === '23503') {
      return 'Cannot perform this action due to related data dependencies';
    }
    
    // Use the centralized error handler
    return handleSupabaseError(error, `Failed to ${operation} customer`);
  }

  /**
   * Get all customers with RLS-aware error handling
   */
  async getAllCustomers(includeInactive: boolean = false): Promise<DatabaseResult<Customer[]>> {
    try {
      let query = supabase
        .from('customers')
        .select(`
          *,
          teams (*),
          contacts!contacts_customer_id_fkey (*),
          documents (*),
          services (*),
          timeline_events (*),
          projects (*)
        `)
        .order('name');

      // Filter out inactive customers unless explicitly requested
      if (!includeInactive) {
        query = query.neq('phase', 'Terminated');
      }

      const { data: customers, error } = await query;

      if (error) {
        return {
          data: null,
          error: this.handleDatabaseError(error, 'fetch customers'),
          code: error.code,
        };
      }

      return {
        data: customers || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleDatabaseError(error, 'fetch customers'),
      };
    }
  }

  /**
   * Get customer by ID with enhanced error handling
   */
  async getCustomerById(id: string): Promise<DatabaseResult<Customer>> {
    try {
      if (!id) {
        return {
          data: null,
          error: 'Customer ID is required',
        };
      }

      const { data: customer, error } = await supabase
        .from('customers')
        .select(`
          *,
          teams (*),
          contacts!contacts_customer_id_fkey (*),
          documents (*),
          services (*),
          timeline_events (*),
          projects (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return {
          data: null,
          error: this.handleDatabaseError(error, 'fetch customer', id),
          code: error.code,
        };
      }

      return {
        data: customer,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleDatabaseError(error, 'fetch customer', id),
      };
    }
  }

  /**
   * Create customer with validation and RLS handling
   */
  async createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Customer>> {
    try {
      // Validate input data
      const validation = this.validateCustomer(customerData);
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.error!,
        };
      }

      const { data: customer, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: this.handleDatabaseError(error, 'create customer'),
          code: error.code,
        };
      }

      return {
        data: customer,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleDatabaseError(error, 'create customer'),
      };
    }
  }

  /**
   * Update customer with RLS permission checking
   */
  async updateCustomer(id: string, updates: Partial<Customer>): Promise<DatabaseResult<Customer>> {
    try {
      if (!id) {
        return {
          data: null,
          error: 'Customer ID is required',
        };
      }

      // Validate input data if provided
      if (Object.keys(updates).length > 0) {
        const validation = this.validateCustomer(updates);
        if (!validation.isValid) {
          return {
            data: null,
            error: validation.error!,
          };
        }
      }

      // Remove read-only fields
      const { id: _, created_at, updated_at, ...cleanUpdates } = updates as any;

      const { data: customer, error } = await supabase
        .from('customers')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: this.handleDatabaseError(error, 'update customer', id),
          code: error.code,
        };
      }

      return {
        data: customer,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleDatabaseError(error, 'update customer', id),
      };
    }
  }

  /**
   * Delete customer with dependency checking
   */
  async deleteCustomer(id: string): Promise<DatabaseResult<boolean>> {
    try {
      if (!id) {
        return {
          data: null,
          error: 'Customer ID is required',
        };
      }

      // Check for dependent records
      const { data: dependencies, error: depError } = await supabase
        .from('processes')
        .select('id')
        .eq('customer_id', id)
        .limit(1);

      if (depError) {
        return {
          data: null,
          error: this.handleDatabaseError(depError, 'check customer dependencies', id),
        };
      }

      if (dependencies && dependencies.length > 0) {
        return {
          data: null,
          error: 'Cannot delete customer with active processes. Please remove all related data first.',
        };
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          data: null,
          error: this.handleDatabaseError(error, 'delete customer', id),
          code: error.code,
        };
      }

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleDatabaseError(error, 'delete customer', id),
      };
    }
  }

  /**
   * Get customers assigned to a specific data manager
   */
  async getAssignedCustomers(userId: string): Promise<DatabaseResult<Customer[]>> {
    try {
      if (!userId) {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      const { data: customers, error } = await supabase
        .from('customers')
        .select(`
          *,
          customer_data_managers!inner (user_id)
        `)
        .eq('customer_data_managers.user_id', userId)
        .order('name');

      if (error) {
        return {
          data: null,
          error: this.handleDatabaseError(error, 'fetch assigned customers'),
          code: error.code,
        };
      }

      return {
        data: customers || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleDatabaseError(error, 'fetch assigned customers'),
      };
    }
  }

  /**
   * Check if user is assigned to customer
   */
  async isUserAssignedToCustomer(userId: string, customerId: string): Promise<DatabaseResult<boolean>> {
    try {
      if (!userId || !customerId) {
        return {
          data: null,
          error: 'User ID and Customer ID are required',
        };
      }

      const { data: assignment, error } = await supabase
        .from('customer_data_managers')
        .select('user_id')
        .eq('user_id', userId)
        .eq('customer_id', customerId)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
        return {
          data: null,
          error: this.handleDatabaseError(error, 'check customer assignment'),
          code: error.code,
        };
      }

      return {
        data: !!assignment,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleDatabaseError(error, 'check customer assignment'),
      };
    }
  }

  /**
   * Assign data manager to customer (admin only)
   */
  async assignDataManager(customerId: string, userId: string, assignedBy: string, notes?: string): Promise<DatabaseResult<any>> {
    try {
      if (!customerId || !userId || !assignedBy) {
        return {
          data: null,
          error: 'Customer ID, User ID, and Assigned By are required',
        };
      }

      const { data: assignment, error } = await supabase
        .from('customer_data_managers')
        .insert([{
          customer_id: customerId,
          user_id: userId,
          assigned_by: assignedBy,
          notes: notes || null,
        }])
        .select()
        .single();

      if (error) {
        // Handle duplicate assignment
        if (error.code === '23505') {
          return {
            data: null,
            error: 'User is already assigned to this customer',
          };
        }

        return {
          data: null,
          error: this.handleDatabaseError(error, 'assign data manager'),
          code: error.code,
        };
      }

      return {
        data: assignment,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleDatabaseError(error, 'assign data manager'),
      };
    }
  }

  /**
   * Remove data manager assignment (admin only)
   */
  async removeDataManagerAssignment(customerId: string, userId: string): Promise<DatabaseResult<boolean>> {
    try {
      if (!customerId || !userId) {
        return {
          data: null,
          error: 'Customer ID and User ID are required',
        };
      }

      const { error } = await supabase
        .from('customer_data_managers')
        .delete()
        .eq('customer_id', customerId)
        .eq('user_id', userId);

      if (error) {
        return {
          data: null,
          error: this.handleDatabaseError(error, 'remove data manager assignment'),
          code: error.code,
        };
      }

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleDatabaseError(error, 'remove data manager assignment'),
      };
    }
  }
}

export const enhancedCustomerService = new EnhancedCustomerService();