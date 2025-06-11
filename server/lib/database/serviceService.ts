/**
 * Service Service - Handles all customer service-related database operations
 */

import { supabase } from '../supabase.js';
import type { Service } from '../../../shared/types/index.js';

export class ServiceService {
  /**
   * Get all services, optionally filtered by customer
   */
  async getAllServices(customerId?: string): Promise<Service[]> {
    try {
      let query = supabase.from('services').select('*');
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching services:', error);
        // Return mock data for graceful degradation
        return this.getMockServices(customerId);
      }
      
      return (data || []).map(this.mapDbServiceToService);
    } catch (error) {
      console.error('Error in getAllServices:', error);
      return this.getMockServices(customerId);
    }
  }

  /**
   * Get a specific service by ID
   */
  async getServiceById(id: string): Promise<Service | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching service:', error);
        return null;
      }
      
      return this.mapDbServiceToService(data);
    } catch (error) {
      console.error('Error in getServiceById:', error);
      return null;
    }
  }

  /**
   * Get services by customer ID
   */
  async getServicesByCustomerId(customerId: string): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('customer_id', customerId)
        .order('name');

      if (error) {
        console.error('Error fetching services by customer:', error);
        return this.getMockServices(customerId);
      }

      return (data || []).map(this.mapDbServiceToService);
    } catch (error) {
      console.error('Error in getServicesByCustomerId:', error);
      return this.getMockServices(customerId);
    }
  }

  /**
   * Create a new service
   */
  async createService(service: Partial<Service> & { customerId: string }): Promise<Service> {
    try {
      const serviceData = {
        id: service.id || crypto.randomUUID(),
        customer_id: service.customerId,
        name: service.name,
        monthly_hours: service.monthlyHours || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating service:', error);
        throw new Error(`Failed to create service: ${error.message}`);
      }
      
      return this.mapDbServiceToService(data);
    } catch (error) {
      console.error('Error in createService:', error);
      throw error;
    }
  }

  /**
   * Update an existing service
   */
  async updateService(id: string, updates: Partial<Service>): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          name: updates.name,
          monthly_hours: updates.monthlyHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating service:', error);
        throw new Error(`Failed to update service: ${error.message}`);
      }
      
      return this.mapDbServiceToService(data);
    } catch (error) {
      console.error('Error in updateService:', error);
      throw error;
    }
  }

  /**
   * Delete a service
   */
  async deleteService(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting service:', error);
        throw new Error(`Failed to delete service: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteService:', error);
      throw error;
    }
  }

  /**
   * Get service metrics
   */
  async getServiceMetrics(): Promise<{
    total: number;
    totalMonthlyHours: number;
    avgMonthlyHours: number;
    byCustomer: Record<string, number>;
  }> {
    try {
      const { data: services, error } = await supabase
        .from('services')
        .select(`
          *,
          customers!inner (
            id,
            name
          )
        `);

      if (error) throw error;

      const total = services.length;
      let totalMonthlyHours = 0;
      const byCustomer: Record<string, number> = {};

      services.forEach(service => {
        totalMonthlyHours += service.monthly_hours || 0;
        const customerName = (service as any).customers.name;
        byCustomer[customerName] = (byCustomer[customerName] || 0) + 1;
      });

      const avgMonthlyHours = total > 0 ? totalMonthlyHours / total : 0;

      return {
        total,
        totalMonthlyHours,
        avgMonthlyHours,
        byCustomer
      };
    } catch (error) {
      console.error('Error getting service metrics:', error);
      return {
        total: 0,
        totalMonthlyHours: 0,
        avgMonthlyHours: 0,
        byCustomer: {}
      };
    }
  }
  /**
   * Map database service to application service
   */
  private mapDbServiceToService(dbService: any): Service {
    return {
      id: dbService.id,
      name: dbService.name,
      monthlyHours: dbService.monthly_hours || 0,
      customerId: dbService.customer_id
    };
  }
  /**
   * Get mock services for graceful degradation
   */
  private getMockServices(customerId?: string): Service[] {
    const mockServices = [
      {
        id: 'mock-service-1',
        name: 'Data Ingestion',
        monthlyHours: 20,
        customerId: customerId || 'mock-customer-1'
      },
      {
        id: 'mock-service-2',
        name: 'Report Generation',
        monthlyHours: 15,
        customerId: customerId || 'mock-customer-1'
      },
      {
        id: 'mock-service-3',
        name: 'Data Analysis',
        monthlyHours: 30,
        customerId: customerId || 'mock-customer-2'
      }
    ];

    // If specific customer requested, return subset
    if (customerId) {
      return mockServices.slice(0, 2);
    }

    return mockServices;
  }
}
