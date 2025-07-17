/**
 * Supabase Authentication Service
 * Handles all authentication operations using Supabase Auth
 */

import { supabase, supabaseAdmin } from '../supabase.js';
import type { User } from '../../../shared/types/index.js';
import type { Request } from 'express';

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: 'Admin' | 'Manager' | 'Viewer';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export class SupabaseAuthService {
  /**
   * Create a new user with email and password
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        throw new Error('User already registered with this email');
      }

      // Generate user ID
      const userId = `user-${Date.now()}`;
      
      // Create user record in users table
      const userRecord = {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'Viewer',
        avatar: null,
        password_hash: `temp-hash-${userData.password}`, // Simple hash for demo
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert([userRecord])
        .select()
        .single();

      if (dbError) {
        throw new Error(`Failed to create user record: ${dbError.message}`);
      }

      return this.mapDbUserToUser(dbUser);
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthSession> {
    try {
      // Get user from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        throw new Error('Invalid email or password');
      }

      // Simple password verification (in production, use proper hashing)
      if (userData.password_hash !== `temp-hash-${credentials.password}`) {
        throw new Error('Invalid email or password');
      }

      // Create access token
      const accessToken = Buffer.from(JSON.stringify({
        userId: userData.id,
        email: userData.email,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      })).toString('base64');

      // Create refresh token
      const refreshToken = Buffer.from(JSON.stringify({
        userId: userData.id,
        type: 'refresh',
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      })).toString('base64');

      const user = this.mapDbUserToUser(userData);

      return {
        user,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  }

  /**
   * Validate an access token and return user
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      // Decode the custom token
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is expired
      if (decoded.exp < Date.now()) {
        return null;
      }

      // Get user from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        return null;
      }

      return this.mapDbUserToUser(userData);
    } catch (error) {
      console.error('Error in validateToken:', error);
      return null;
    }
  }

  /**
   * Get user from request session
   */
  async getUserFromSession(request: Request): Promise<User | null> {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      return await this.validateToken(token);
    } catch (error) {
      console.error('Error in getUserFromSession:', error);
      return null;
    }
  }

  /**
   * Refresh an access token
   */
  async refreshToken(refreshToken: string): Promise<AuthSession | null> {
    try {
      // Decode the custom refresh token
      const decoded = JSON.parse(Buffer.from(refreshToken, 'base64').toString());
      
      // Check if refresh token is expired
      if (decoded.exp < Date.now() || decoded.type !== 'refresh') {
        return null;
      }

      // Get user from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        return null;
      }

      // Create new tokens
      const accessToken = Buffer.from(JSON.stringify({
        userId: userData.id,
        email: userData.email,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      })).toString('base64');

      const newRefreshToken = Buffer.from(JSON.stringify({
        userId: userData.id,
        type: 'refresh',
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      })).toString('base64');

      const user = this.mapDbUserToUser(userData);

      return {
        user,
        accessToken,
        refreshToken: newRefreshToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };
    } catch (error) {
      console.error('Error in refreshToken:', error);
      return null;
    }
  }

  /**
   * Sign out user
   */
  async signOut(token: string): Promise<void> {
    try {
      // For custom tokens, we don't need to do anything server-side
      // The client will just remove the token from storage
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error in signOut:', error);
      // Don't throw error for signout failures
    }
  }

  /**
   * Reset password for user
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
      });

      if (error) {
        throw new Error(`Password reset failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in resetPassword:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        throw new Error(`Password update failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updatePassword:', error);
      throw error;
    }
  }

  /**
   * Get user by ID from database
   */
  private async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapDbUserToUser(data);
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
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
   * Verify user has specific role
   */
  async verifyUserRole(userId: string, requiredRole: string | string[]): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return false;
      }

      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      return roles.includes(user.role);
    } catch (error) {
      console.error('Error in verifyUserRole:', error);
      return false;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(requestingUserId: string): Promise<User[]> {
    try {
      // Verify requesting user is admin
      const isAdmin = await this.verifyUserRole(requestingUserId, 'Admin');
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      return (data || []).map(this.mapDbUserToUser);
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<Pick<User, 'name' | 'role' | 'avatar'>>): Promise<User> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Failed to update user: ${error?.message || 'User not found'}`);
      }

      return this.mapDbUserToUser(data);
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string, requestingUserId: string): Promise<void> {
    try {
      // Verify requesting user is admin
      const isAdmin = await this.verifyUserRole(requestingUserId, 'Admin');
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Prevent self-deletion
      if (userId === requestingUserId) {
        throw new Error('Cannot delete your own account');
      }

      // Delete from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        throw new Error(`Failed to delete user from auth: ${authError.message}`);
      }

      // Delete from users table (should cascade automatically)
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) {
        console.error('Warning: Failed to delete user from database:', dbError.message);
      }
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  }
}