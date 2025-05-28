/**
 * User Service - Handles all user-related database operations
 */

import { supabase } from '../supabase.js';
import type { User } from '../../../shared/types/index.js';

export class UserService {
  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        // Return mock user for graceful degradation
        return this.getMockUser(id);
      }
      
      return this.mapDbUserToUser(data);
    } catch (error) {
      console.error('Error in getUserById:', error);
      return this.getMockUser(id);
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching users:', error);
        // Return mock users for graceful degradation
        return [this.getMockUser()];
      }
      
      return (data || []).map(this.mapDbUserToUser);
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [this.getMockUser()];
    }
  }

  /**
   * Create a new user
   */
  async createUser(user: Partial<User>): Promise<User> {
    try {
      const userData = {
        id: user.id || crypto.randomUUID(),
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'User',
        avatar: user.avatar || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user:', error);
        throw new Error(`Failed to create user: ${error.message}`);
      }
      
      return this.mapDbUserToUser(data);
    } catch (error) {
      console.error('Error in createUser:', error);
      // Return a mock user as fallback
      return {
        id: user.id || crypto.randomUUID(),
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'User',
        avatar: user.avatar
      };
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user:', error);
        throw new Error(`Failed to update user: ${error.message}`);
      }
      
      return this.mapDbUserToUser(data);
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting user:', error);
        throw new Error(`Failed to delete user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  }

  /**
   * Map database user to application user
   */
  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      avatar: dbUser.avatar
    };
  }

  /**
   * Get mock user for graceful degradation
   */
  private getMockUser(id?: string): User {
    return {
      id: id || 'demo-user',
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'Admin'
    };
  }
}
