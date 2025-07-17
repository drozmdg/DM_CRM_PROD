/**
 * Database Service Index - Main entry point for all database operations
 */

import { CustomerService } from './customerService.js';
import { ProcessService } from './processService.js';
import { TeamService } from './teamService.js';
import { ContactService } from './contactService.js';
import { ServiceService } from './serviceService.js';
import { DocumentService } from './documentService.js';
import { ChatService } from './chatService.js';
import { UserService } from './userService.js';
import { NoteService } from './noteService.js';
import { ProductService } from './productService.js';
import { supabase, checkSupabaseConnection } from '../supabase.js';

export class DatabaseService {
  public customers: CustomerService;
  public processes: ProcessService;
  public teams: TeamService;
  public contacts: ContactService;
  public services: ServiceService;
  public documents: DocumentService;
  public chat: ChatService;
  public users: UserService;
  public notes: NoteService;
  public products: ProductService;

  constructor() {
    this.customers = new CustomerService();
    this.processes = new ProcessService();
    this.teams = new TeamService();
    this.contacts = new ContactService();
    this.services = new ServiceService();
    this.documents = new DocumentService();
    this.chat = new ChatService();
    this.users = new UserService();
    this.notes = new NoteService();
    this.products = new ProductService();
  }
  /**
   * Initialize the database connection and verify it's working
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if we have proper Supabase configuration
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.warn('⚠️  Database service initialized in mock mode (no Supabase credentials)');
        return true; // Allow the app to start even without Supabase
      }

      const isConnected = await checkSupabaseConnection();
      if (isConnected) {
        console.log('✅ Database service initialized successfully');
        return true;
      } else {
        console.warn('⚠️  Database connection failed, running in mock mode');
        return true; // Still allow the app to start
      }
    } catch (error) {
      console.warn('⚠️  Error initializing database service, running in mock mode:', error);
      return true; // Still allow the app to start
    }
  }

  /**
   * Get database health status
   */  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    timestamp: string;
  }> {
    try {
      // Check if we have proper Supabase configuration
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        return {
          status: 'healthy',
          message: 'Running in mock mode (no Supabase credentials)',
          timestamp: new Date().toISOString()
        };
      }

      const isConnected = await checkSupabaseConnection();
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        message: isConnected ? 'Database connection is working' : 'Database connection failed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<{
    customers: {
      total: number;
      byPhase: Record<string, number>;
    };
    processes: {
      total: number;
      byStatus: Record<string, number>;
      byStage: Record<string, number>;
      avgEstimate: number;
    };
    services: {
      total: number;
      byCustomer: Record<string, number>;
    };
    documents: {
      total: number;
      totalSize: number;
      byCategory: Record<string, number>;
      byCustomer: Record<string, number>;
    };
  }> {
    try {      // Get customer metrics (only active customers)
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('phase')
        .eq('active', true);

      if (customerError) throw customerError;

      const customersByPhase: Record<string, number> = {};
      customers.forEach(customer => {
        customersByPhase[customer.phase] = (customersByPhase[customer.phase] || 0) + 1;
      });      // Get process metrics
      const processMetrics = await this.processes.getProcessMetrics();

      // Get service metrics
      const serviceMetrics = await this.services.getServiceMetrics();

      // Get document metrics
      const documentMetrics = await this.documents.getDocumentMetrics();

      return {
        customers: {
          total: customers.length,
          byPhase: customersByPhase
        },
        processes: processMetrics,
        services: serviceMetrics,
        documents: documentMetrics
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const databaseService = new DatabaseService();

// Export individual services for direct access if needed
export { CustomerService, ProcessService, TeamService, ContactService, ServiceService, DocumentService, ChatService, UserService, NoteService, ProductService };
export { supabase } from '../supabase.js';
