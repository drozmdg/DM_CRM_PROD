import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SupabaseAuthService } from '../server/lib/auth/supabaseAuthService';
import { testDb, cleanupTestUser, mockEnv } from './setup';

describe('Authentication Service', () => {
  let authService: SupabaseAuthService;
  let testUserId: string | null = null;

  beforeEach(() => {
    // Mock environment variables
    process.env = { ...process.env, ...mockEnv };
    authService = new SupabaseAuthService();
  });

  afterEach(async () => {
    // Cleanup test user if created
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  describe('User Registration', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test.register@example.com',
        password: 'SecurePassword123!',
        name: 'Test Register User',
        role: 'Viewer' as const
      };

      const result = await authService.createUser(userData);
      
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(result.role).toBe(userData.role);
      expect(result.id).toBeDefined();
      
      // Store for cleanup
      testUserId = result.id;
    });

    it('should not create user with duplicate email', async () => {
      // First create a user
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        name: 'First User',
        role: 'Viewer' as const
      };

      const firstResult = await authService.createUser(userData);
      testUserId = firstResult.id;

      // Try to create another user with same email
      try {
        await authService.createUser({
          ...userData,
          name: 'Second User'
        });
        expect.fail('Should have thrown an error for duplicate email');
      } catch (error: any) {
        expect(error.message).toContain('already registered');
      }
    });

    it('should validate required fields', async () => {
      const invalidUserData = {
        email: '', // Empty email
        password: 'SecurePassword123!',
        name: 'Test User',
        role: 'Viewer' as const
      };

      try {
        await authService.createUser(invalidUserData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      // Create test user first
      const userData = {
        email: 'test.login@example.com',
        password: 'SecurePassword123!',
        name: 'Test Login User',
        role: 'Viewer' as const
      };

      const createResult = await authService.createUser(userData);
      testUserId = createResult.id;

      // Test login
      const loginResult = await authService.login({
        email: userData.email,
        password: userData.password
      });

      expect(loginResult).toBeDefined();
      expect(loginResult.user).toBeDefined();
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.user.email).toBe(userData.email);
    });

    it('should fail login with invalid credentials', async () => {
      try {
        await authService.login({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });
        expect.fail('Should have thrown authentication error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid');
      }
    });

    it('should fail login for inactive user', async () => {
      // Create inactive user directly in database
      const userId = `test-inactive-${Date.now()}`;
      const userData = {
        id: userId,
        email: 'test.inactive@example.com',
        name: 'Inactive User',
        role: 'Viewer',
        password_hash: 'temp-hash-SecurePassword123!',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await testDb.from('users').insert(userData);
      if (!error) {
        testUserId = userId;
      }

      // Try to login
      try {
        await authService.login({
          email: 'test.inactive@example.com',
          password: 'SecurePassword123!'
        });
        expect.fail('Should have failed for inactive user');
      } catch (error: any) {
        expect(error.message).toContain('Invalid');
      }
    });
  });

  describe('Authentication Methods', () => {
    it('should handle authentication workflow', async () => {
      // Test the complete workflow
      const userData = {
        email: 'workflow.test@example.com',
        password: 'WorkflowTest123!',
        name: 'Workflow Test User',
        role: 'Manager' as const
      };

      // 1. Create user
      const user = await authService.createUser(userData);
      testUserId = user.id;
      
      expect(user.role).toBe('Manager');

      // 2. Login
      const session = await authService.login({
        email: userData.email,
        password: userData.password
      });

      expect(session.user.role).toBe('Manager');
      expect(session.accessToken).toBeDefined();

      // 3. Verify the user exists in database
      const { data: dbUser, error: dbError } = await testDb
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbError) {
        console.log('Database query error:', dbError);
      }

      expect(dbUser).toBeDefined();
      expect(dbUser?.email).toBe(userData.email);
      expect(dbUser?.role).toBe('Manager');
    });
  });
});