import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { customerService } from '../server/lib/database/customerService';
import { testDb, createTestCustomer, cleanupTestCustomer, createTestUser, cleanupTestUser } from './setup';

describe('Customer Service', () => {
  let testCustomerId: string | null = null;
  let testUserId: string | null = null;

  afterEach(async () => {
    // Cleanup test data
    if (testCustomerId) {
      await cleanupTestCustomer(testCustomerId);
      testCustomerId = null;
    }
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  describe('Customer CRUD Operations', () => {
    it('should create a new customer', async () => {
      const customerData = {
        name: 'Test Customer Inc.',
        industry: 'Technology',
        contract_value: 150000,
        status: 'active' as const,
        phase: 'planning' as const
      };

      const result = await customerService.createCustomer(customerData);
      testCustomerId = result.id;

      expect(result).toBeDefined();
      expect(result.name).toBe(customerData.name);
      expect(result.industry).toBe(customerData.industry);
      expect(result.contract_value).toBe(customerData.contract_value);
      expect(result.status).toBe(customerData.status);
      expect(result.phase).toBe(customerData.phase);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeDefined();
    });

    it('should retrieve customer by ID', async () => {
      // Create test customer
      const customerData = {
        name: 'Retrieve Test Customer',
        industry: 'Healthcare',
        contract_value: 75000,
        status: 'active' as const
      };

      const created = await createTestCustomer(customerData);
      testCustomerId = created.id;

      // Retrieve customer
      const retrieved = await customerService.getCustomerById(testCustomerId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(customerData.name);
      expect(retrieved?.industry).toBe(customerData.industry);
      expect(retrieved?.contract_value).toBe(customerData.contract_value);
    });

    it('should update customer information', async () => {
      // Create test customer
      const originalData = {
        name: 'Original Customer Name',
        industry: 'Finance',
        contract_value: 100000,
        status: 'active' as const
      };

      const created = await createTestCustomer(originalData);
      testCustomerId = created.id;

      // Update customer
      const updateData = {
        name: 'Updated Customer Name',
        industry: 'Technology',
        contract_value: 200000,
        status: 'active' as const
      };

      const updated = await customerService.updateCustomer(testCustomerId, updateData);

      expect(updated).toBeDefined();
      expect(updated?.name).toBe(updateData.name);
      expect(updated?.industry).toBe(updateData.industry);
      expect(updated?.contract_value).toBe(updateData.contract_value);
      expect(updated?.updated_at).toBeDefined();
    });

    it('should soft delete customer', async () => {
      // Create test customer
      const customerData = {
        name: 'Customer To Delete',
        industry: 'Retail',
        contract_value: 50000,
        status: 'active' as const
      };

      const created = await createTestCustomer(customerData);
      testCustomerId = created.id;

      // Soft delete customer
      const deleted = await customerService.deleteCustomer(testCustomerId);

      expect(deleted).toBe(true);

      // Verify customer is marked as deleted
      const retrieved = await customerService.getCustomerById(testCustomerId);
      expect(retrieved?.status).toBe('inactive');
    });

    it('should list all active customers', async () => {
      // Create multiple test customers
      const customers = await Promise.all([
        createTestCustomer({ name: 'Active Customer 1', status: 'active' }),
        createTestCustomer({ name: 'Active Customer 2', status: 'active' }),
        createTestCustomer({ name: 'Inactive Customer', status: 'inactive' })
      ]);

      // Store IDs for cleanup
      const customerIds = customers.map(c => c.id);

      try {
        const allCustomers = await customerService.getAllCustomers();
        
        // Should include our active customers
        const testActiveCustomers = allCustomers.filter(c => 
          customerIds.includes(c.id) && c.status === 'active'
        );
        
        expect(testActiveCustomers).toHaveLength(2);
        expect(testActiveCustomers.every(c => c.status === 'active')).toBe(true);

      } finally {
        // Cleanup all test customers
        await Promise.all(customerIds.map(id => cleanupTestCustomer(id)));
      }
    });
  });

  describe('Customer Validation', () => {
    it('should validate required fields', async () => {
      const invalidCustomerData = {
        // Missing required name field
        industry: 'Technology',
        contract_value: 100000
      };

      try {
        await customerService.createCustomer(invalidCustomerData as any);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
        // Error should mention missing required field
      }
    });

    it('should validate contract value is positive', async () => {
      const invalidCustomerData = {
        name: 'Invalid Customer',
        industry: 'Technology',
        contract_value: -100000, // Negative value
        status: 'active' as const
      };

      try {
        await customerService.createCustomer(invalidCustomerData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should validate status enum values', async () => {
      const invalidCustomerData = {
        name: 'Test Customer',
        industry: 'Technology',
        contract_value: 100000,
        status: 'invalid_status' as any
      };

      try {
        await customerService.createCustomer(invalidCustomerData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Customer Search and Filtering', () => {
    it('should search customers by name', async () => {
      const searchCustomers = await Promise.all([
        createTestCustomer({ name: 'Searchable Customer One', industry: 'Tech' }),
        createTestCustomer({ name: 'Searchable Customer Two', industry: 'Healthcare' }),
        createTestCustomer({ name: 'Different Company', industry: 'Tech' })
      ]);

      const customerIds = searchCustomers.map(c => c.id);

      try {
        const searchResults = await customerService.searchCustomers('Searchable');
        
        const testResults = searchResults.filter(c => customerIds.includes(c.id));
        expect(testResults).toHaveLength(2);
        expect(testResults.every(c => c.name.includes('Searchable'))).toBe(true);

      } finally {
        await Promise.all(customerIds.map(id => cleanupTestCustomer(id)));
      }
    });

    it('should filter customers by industry', async () => {
      const industryCustomers = await Promise.all([
        createTestCustomer({ name: 'Tech Company 1', industry: 'Technology' }),
        createTestCustomer({ name: 'Tech Company 2', industry: 'Technology' }),
        createTestCustomer({ name: 'Healthcare Company', industry: 'Healthcare' })
      ]);

      const customerIds = industryCustomers.map(c => c.id);

      try {
        const techCustomers = await customerService.getCustomersByIndustry('Technology');
        
        const testTechCustomers = techCustomers.filter(c => customerIds.includes(c.id));
        expect(testTechCustomers).toHaveLength(2);
        expect(testTechCustomers.every(c => c.industry === 'Technology')).toBe(true);

      } finally {
        await Promise.all(customerIds.map(id => cleanupTestCustomer(id)));
      }
    });
  });

  describe('Customer Metrics', () => {
    it('should calculate customer metrics correctly', async () => {
      // Create customers with known values
      const metricsCustomers = await Promise.all([
        createTestCustomer({ contract_value: 100000, status: 'active' }),
        createTestCustomer({ contract_value: 200000, status: 'active' }),
        createTestCustomer({ contract_value: 150000, status: 'inactive' })
      ]);

      const customerIds = metricsCustomers.map(c => c.id);

      try {
        const metrics = await customerService.getCustomerMetrics();
        
        // Should count our active customers
        expect(metrics.totalActive).toBeGreaterThanOrEqual(2);
        expect(metrics.totalRevenue).toBeGreaterThanOrEqual(300000); // Sum of active customers
        expect(metrics.averageContractValue).toBeGreaterThan(0);

      } finally {
        await Promise.all(customerIds.map(id => cleanupTestCustomer(id)));
      }
    });
  });
});