/**
 * Local PostgreSQL Authentication Service
 * Handles authentication using the local PostgreSQL database
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { getAuthConfig } from './authConfig.js';

// PostgreSQL client
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Viewer';
  avatar?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
  code?: string;
}

export class LocalAuthService {
  private config = getAuthConfig();

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Find user by email
      const result = await pool.query(
        'SELECT id, email, name, role, avatar, is_active, email_verified, password_hash, failed_login_attempts, locked_until, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        };
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return {
          success: false,
          error: 'Account is disabled',
          code: 'ACCOUNT_DISABLED'
        };
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return {
          success: false,
          error: 'Account is temporarily locked',
          code: 'ACCOUNT_LOCKED'
        };
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        // Increment failed login attempts
        await this.incrementFailedAttempts(user.id);
        return {
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        };
      }

      // Reset failed login attempts on successful login
      await this.resetFailedAttempts(user.id);

      // Update last login
      await pool.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const token = this.generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      // Generate refresh token
      const refreshToken = this.generateRefreshToken(user.id);

      // Save session
      await this.createSession(user.id, token, refreshToken);

      // Return user without password hash
      const { password_hash, failed_login_attempts, locked_until, ...safeUser } = user;

      return {
        success: true,
        user: safeUser,
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      };
    }
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string, role: 'Admin' | 'Manager' | 'Viewer' = 'Viewer'): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return {
          success: false,
          error: 'User already exists',
          code: 'USER_EXISTS'
        };
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Generate user ID
      const userId = `user-${Date.now()}`;

      // Create user
      const result = await pool.query(`
        INSERT INTO users (id, email, name, role, password_hash, is_active, email_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, false, NOW(), NOW())
        RETURNING id, email, name, role, avatar, is_active, email_verified, created_at, updated_at
      `, [userId, email, name, role, passwordHash]);

      const user = result.rows[0];

      // Generate tokens
      const token = this.generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      const refreshToken = this.generateRefreshToken(user.id);

      // Save session
      await this.createSession(user.id, token, refreshToken);

      return {
        success: true,
        user,
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      };
    }
  }

  /**
   * Verify JWT token and get user
   */
  async verifyToken(token: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as any;

      // Get user from database
      const result = await pool.query(
        'SELECT id, email, name, role, avatar, is_active, email_verified, created_at, updated_at FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return {
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        };
      }

      return {
        success: true,
        user: result.rows[0]
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      };
    }
  }

  /**
   * Get user from session/request (for middleware)
   */
  async getUserFromSession(req: any): Promise<User | null> {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const result = await this.verifyToken(token);
      
      return result.success ? result.user || null : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(token: string): Promise<AuthResult> {
    try {
      // Delete session
      await pool.query('DELETE FROM user_sessions WHERE session_token = $1', [token]);

      return {
        success: true
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Logout failed',
        code: 'LOGOUT_ERROR'
      };
    }
  }

  // Private helper methods

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      // Handle both bcrypt and temp hashes from migration
      if (hash.startsWith('temp-hash-')) {
        // For migrated data with temp hashes, use simple comparison
        return hash === `temp-hash-${password}`;
      }
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  private generateToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn
    });
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: 'refresh' }, this.config.jwtSecret, {
      expiresIn: this.config.refreshTokenExpiresIn
    });
  }

  private async createSession(userId: string, token: string, refreshToken: string): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + (24 * 60 * 60 * 1000)); // 24 hours

      await pool.query(`
        INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at, created_at, last_used)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (session_token) DO UPDATE SET
          refresh_token = EXCLUDED.refresh_token,
          expires_at = EXCLUDED.expires_at,
          last_used = NOW()
      `, [userId, token, refreshToken, expiresAt]);
    } catch (error) {
      console.error('Session creation error:', error);
    }
  }

  private async incrementFailedAttempts(userId: string): Promise<void> {
    try {
      const result = await pool.query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1 RETURNING failed_login_attempts',
        [userId]
      );

      const attempts = result.rows[0]?.failed_login_attempts || 0;

      // Lock account after max attempts
      if (attempts >= this.config.loginMaxAttempts) {
        const lockUntil = new Date();
        lockUntil.setTime(lockUntil.getTime() + this.config.loginWindowMs);

        await pool.query(
          'UPDATE users SET locked_until = $1 WHERE id = $2',
          [lockUntil, userId]
        );
      }
    } catch (error) {
      console.error('Failed to increment login attempts:', error);
    }
  }

  private async resetFailedAttempts(userId: string): Promise<void> {
    try {
      await pool.query(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Failed to reset login attempts:', error);
    }
  }
}