import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserService } from '../../server/lib/database/userService.js';
import { supabase } from '../../server/lib/supabase.js';
import type { User } from '../../shared/types/index.js';

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis()
};

vi.mock('../../server/lib/supabase.js', () => ({
  supabase: mockSupabase
}));

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserById', () => {
    it('should return a user when found', async () => {
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin',
        avatar: null
      };

      // Mock successful response
      mockSupabase.single.mockResolvedValue({
        data: mockUser,
        error: null
      });

      const result = await userService.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
      expect(supabase.single).toHaveBeenCalled();
    });

    it('should return mock user when database error occurs', async () => {
      // Mock error response
      (supabase.single as any).mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const result = await userService.getUserById('invalid-id');

      expect(result).toEqual({
        id: 'invalid-id',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'Admin'
      });
    });

    it('should handle exceptions gracefully', async () => {
      // Mock exception
      (supabase.single as any).mockRejectedValue(new Error('Database connection failed'));

      const result = await userService.getUserById('1');

      expect(result).toEqual({
        id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'Admin'
      });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users when successful', async () => {
      const mockUsers = [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', avatar: null },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User', avatar: null }
      ];

      // Mock successful response
      (supabase.order as any).mockResolvedValue({
        data: mockUsers,
        error: null
      });

      const result = await userService.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.order).toHaveBeenCalledWith('name', { ascending: true });
    });

    it('should return mock users when database error occurs', async () => {
      // Mock error response
      (supabase.order as any).mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await userService.getAllUsers();

      expect(result).toEqual([{
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'Admin'
      }]);
    });

    it('should handle exceptions gracefully', async () => {
      // Mock exception
      (supabase.order as any).mockRejectedValue(new Error('Database connection failed'));

      const result = await userService.getAllUsers();

      expect(result).toEqual([{
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'Admin'
      }]);
    });
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const newUser: Partial<User> = {
        name: 'New User',
        email: 'new@example.com',
        role: 'User'
      };

      const mockCreatedUser = {
        id: 'generated-id',
        name: 'New User',
        email: 'new@example.com',
        role: 'User',
        avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock successful response
      (supabase.single as any).mockResolvedValue({
        data: mockCreatedUser,
        error: null
      });

      const result = await userService.createUser(newUser);

      expect(result).toEqual({
        id: 'generated-id',
        name: 'New User',
        email: 'new@example.com',
        role: 'User',
        avatar: null
      });
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.insert).toHaveBeenCalled();
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
    });

    it('should handle creation errors gracefully', async () => {
      const newUser: Partial<User> = {
        name: 'New User',
        email: 'new@example.com',
        role: 'User'
      };

      // Mock error response
      (supabase.single as any).mockResolvedValue({
        data: null,
        error: { message: 'Duplicate email' }
      });

      const result = await userService.createUser(newUser);

      // Should return fallback user data
      expect(result.name).toBe('New User');
      expect(result.email).toBe('new@example.com');
      expect(result.role).toBe('User');
    });

    it('should generate ID when not provided', async () => {
      const newUser: Partial<User> = {
        name: 'User Without ID',
        email: 'user@example.com'
      };

      const mockCreatedUser = {
        id: 'auto-generated-id',
        name: 'User Without ID',
        email: 'user@example.com',
        role: 'User',
        avatar: null
      };

      (supabase.single as any).mockResolvedValue({
        data: mockCreatedUser,
        error: null
      });

      const result = await userService.createUser(newUser);

      expect(result.id).toBeTruthy();
      expect(result.name).toBe('User Without ID');
      expect(result.role).toBe('User'); // Default role
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const updates: Partial<User> = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const mockUpdatedUser = {
        id: '1',
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'Admin',
        avatar: null,
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock successful response
      (supabase.single as any).mockResolvedValue({
        data: mockUpdatedUser,
        error: null
      });

      const result = await userService.updateUser('1', updates);

      expect(result).toEqual({
        id: '1',
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'Admin',
        avatar: null
      });
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.update).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      const updates: Partial<User> = {
        name: 'Updated Name'
      };

      // Mock error response
      (supabase.single as any).mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      await expect(userService.updateUser('invalid-id', updates))
        .rejects.toThrow('Failed to update user: User not found');
    });

    it('should only update provided fields', async () => {
      const updates: Partial<User> = {
        name: 'New Name Only'
      };

      const mockUpdatedUser = {
        id: '1',
        name: 'New Name Only',
        email: 'original@example.com',
        role: 'User',
        avatar: null
      };

      (supabase.single as any).mockResolvedValue({
        data: mockUpdatedUser,
        error: null
      });

      const result = await userService.updateUser('1', updates);

      expect(result.name).toBe('New Name Only');
      expect(result.email).toBe('original@example.com');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      // Mock successful response
      (supabase.delete as any).mockResolvedValue({
        error: null
      });

      await expect(userService.deleteUser('1')).resolves.toBeUndefined();

      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw error when deletion fails', async () => {
      // Mock error response
      (supabase.delete as any).mockResolvedValue({
        error: { message: 'User not found' }
      });

      await expect(userService.deleteUser('invalid-id'))
        .rejects.toThrow('Failed to delete user: User not found');
    });

    it('should handle exceptions during deletion', async () => {
      // Mock exception
      (supabase.delete as any).mockRejectedValue(new Error('Database connection failed'));

      await expect(userService.deleteUser('1'))
        .rejects.toThrow('Database connection failed');
    });
  });
});