import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server/.env
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

// Test database configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables for testing');
}

export const testDb = createClient(supabaseUrl, supabaseServiceKey);

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  // Initialize test database connection
  try {
    const { data, error } = await testDb.from('users').select('count').limit(1);
    if (error) {
      console.warn('Database connection test failed:', error.message);
    } else {
      console.log('✅ Database connection established');
    }
  } catch (error) {
    console.warn('Database setup error:', error);
  }
});

// Global test cleanup
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  // Any global cleanup can go here
});

// Test isolation setup
beforeEach(async () => {
  // Setup for each test - can be overridden in individual test files
  // Clear any test data that might interfere
  const testEmailPattern = '%test%';
  await testDb.from('users').delete().like('email', testEmailPattern);
  await testDb.from('customers').delete().like('name', '%Test Customer%');
});

afterEach(async () => {
  // Cleanup after each test - can be overridden in individual test files
  const testEmailPattern = '%test%';
  await testDb.from('users').delete().like('email', testEmailPattern);
  await testDb.from('customers').delete().like('name', '%Test Customer%');
});

// Test utilities
export const createTestUser = async (userData: any = {}) => {
  const userId = `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const defaultUser = {
    id: userId,
    email: userData.email || `test-${userId}@example.com`,
    name: 'Test User',
    role: 'Viewer',
    is_active: true,
    password_hash: 'test-hash',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...userData
  };

  const { data, error } = await testDb
    .from('users')
    .insert(defaultUser)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const cleanupTestUser = async (userId: string) => {
  await testDb.from('users').delete().eq('id', userId);
};

export const createTestCustomer = async (customerData: any = {}) => {
  const customerId = `test-customer-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const defaultCustomer = {
    id: customerId,
    name: customerData.name || `Test Customer ${customerId}`,
    industry: 'Technology',
    contract_value: 100000,
    status: 'active',
    phase: 'Steady State',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...customerData
  };

  const { data, error } = await testDb
    .from('customers')
    .insert(defaultCustomer)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const cleanupTestCustomer = async (customerId: string) => {
  await testDb.from('customers').delete().eq('id', customerId);
};

// Mock environment for tests
export const mockEnv = {
  NODE_ENV: 'test',
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
  JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d'
};