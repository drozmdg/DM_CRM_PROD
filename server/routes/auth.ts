/**
 * Authentication Routes
 * Handles user authentication, registration, and profile management
 */

import { Router } from 'express';
import { LocalAuthService } from '../lib/auth/localAuthService.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { authRateLimit, passwordResetRateLimit } from '../middleware/security.js';
import { validateInput, secureString, secureEmail } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();
const authService = new LocalAuthService();

// Enhanced validation schemas with security
const registerSchema = z.object({
  email: secureEmail,
  password: z.string().min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or less')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').pipe(secureString(100)),
  role: z.enum(['Admin', 'Manager', 'Viewer']).optional()
});

const loginSchema = z.object({
  email: secureEmail,
  password: z.string().min(1, 'Password is required').max(128, 'Invalid password')
});

const resetPasswordSchema = z.object({
  email: secureEmail
});

const updatePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or less')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').pipe(secureString(100)).optional(),
  role: z.enum(['Admin', 'Manager', 'Viewer']).optional(),
  avatar: z.string().url('Invalid avatar URL').max(512, 'Avatar URL too long').optional().or(z.literal(''))
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authRateLimit, validateInput(registerSchema), async (req, res) => {
  try {
    const validatedData = req.body; // Already validated by middleware

    const result = await authService.register(validatedData.email, validatedData.password, validatedData.name, validatedData.role);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.token,
        refreshToken: result.refreshToken
      },
      message: 'User registered successfully'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message?.includes('User already registered')) {
      res.status(409).json({
        success: false,
        error: 'User already exists with this email',
        code: 'USER_EXISTS'
      });
      return;
    }

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed',
      code: 'REGISTRATION_FAILED'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return session
 */
router.post('/login', authRateLimit, validateInput(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.token,
        refreshToken: result.refreshToken
      },
      message: 'Login successful'
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      });
      return;
    }

    const session = await authService.refreshToken(refreshToken);

    if (!session) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt
      },
      message: 'Token refreshed successfully'
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

/**
 * POST /api/auth/logout
 * Sign out user
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7); // Remove 'Bearer ' prefix

    if (token) {
      await authService.logout(token);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
});

/**
 * PUT /api/auth/me
 * Update current user profile
 */
router.put('/me', requireAuth, async (req, res) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);

    const updatedUser = await authService.updateUserProfile(req.user!.id, validatedData);

    res.json({
      success: true,
      data: {
        user: updatedUser
      },
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      code: 'PROFILE_UPDATE_FAILED'
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Send password reset email
 */
router.post('/reset-password', passwordResetRateLimit, validateInput(resetPasswordSchema), async (req, res) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);

    await authService.resetPassword(validatedData.email);

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Password reset failed',
      code: 'PASSWORD_RESET_FAILED'
    });
  }
});

/**
 * POST /api/auth/update-password
 * Update user password (for authenticated users)
 */
router.post('/update-password', requireAuth, async (req, res) => {
  try {
    const validatedData = updatePasswordSchema.parse(req.body);

    await authService.updatePassword(req.user!.id, validatedData.newPassword);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    console.error('Password update error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Password update failed',
      code: 'PASSWORD_UPDATE_FAILED'
    });
  }
});

/**
 * GET /api/auth/users
 * Get all users (admin only)
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await authService.getAllUsers(req.user!.id);

    res.json({
      success: true,
      data: {
        users
      }
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      code: 'USERS_FETCH_FAILED'
    });
  }
});

/**
 * PUT /api/auth/users/:userId
 * Update user profile (admin only)
 */
router.put('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const validatedData = updateProfileSchema.parse(req.body);

    const updatedUser = await authService.updateUserProfile(userId, validatedData);

    res.json({
      success: true,
      data: {
        user: updatedUser
      },
      message: 'User updated successfully'
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      code: 'USER_UPDATE_FAILED'
    });
  }
});

/**
 * DELETE /api/auth/users/:userId
 * Delete user (admin only)
 */
router.delete('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    await authService.deleteUser(userId, req.user!.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user',
      code: 'USER_DELETE_FAILED'
    });
  }
});

export default router;