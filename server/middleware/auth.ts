/**
 * Authentication Middleware
 * Provides authentication and authorization middleware for Express routes
 */

import type { Request, Response, NextFunction } from 'express';
import { LocalAuthService } from '../lib/auth/localAuthService.js';
import type { User } from '../../shared/types/index.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const authService = new LocalAuthService();

/**
 * Middleware to authenticate user and attach to request
 * Does not require authentication - used for optional auth
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getUserFromSession(req);
    req.user = user || undefined;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    req.user = undefined;
    next();
  }
};

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getUserFromSession(req);
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication required middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Middleware to require specific role(s)
 * Returns 403 if user doesn't have required role
 */
export const requireRole = (roles: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First ensure user is authenticated
      if (!req.user) {
        await requireAuth(req, res, () => {});
        if (!req.user) {
          return; // requireAuth already sent response
        }
      }

      const userRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!userRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: `Access denied. Required role: ${userRoles.join(' or ')}`,
          code: 'FORBIDDEN'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role authorization middleware error:', error);
      res.status(403).json({
        success: false,
        error: 'Authorization failed',
        code: 'AUTH_FAILED'
      });
    }
  };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('Admin');

/**
 * Middleware to require admin or manager role
 */
export const requireManagerOrAdmin = requireRole(['Admin', 'Manager']);

/**
 * Middleware to validate resource ownership or admin access
 * Checks if user owns resource or is admin
 */
export const requireOwnershipOrAdmin = (getResourceUserId: (req: Request) => string | Promise<string>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First ensure user is authenticated
      if (!req.user) {
        await requireAuth(req, res, () => {});
        if (!req.user) {
          return; // requireAuth already sent response
        }
      }

      // Admin can access any resource
      if (req.user.role === 'Admin') {
        next();
        return;
      }

      // Check if user owns the resource
      const resourceUserId = await getResourceUserId(req);
      
      if (req.user.id !== resourceUserId) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You can only access your own resources.',
          code: 'FORBIDDEN'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Ownership authorization middleware error:', error);
      res.status(403).json({
        success: false,
        error: 'Authorization failed',
        code: 'AUTH_FAILED'
      });
    }
  };
};

/**
 * Middleware to rate limit authentication attempts
 */
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [key, value] of attempts) {
      if (now > value.resetTime) {
        attempts.delete(key);
      }
    }

    const currentAttempts = attempts.get(ip);
    
    if (!currentAttempts) {
      attempts.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (currentAttempts.count >= maxAttempts) {
      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((currentAttempts.resetTime - now) / 1000)
      });
      return;
    }

    currentAttempts.count++;
    next();
  };
};

/**
 * Error handler for authentication errors
 */
export const authErrorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Authentication error:', error);

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
    return;
  }

  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal authentication error',
    code: 'AUTH_ERROR'
  });
};

/**
 * Utility function to get current user from request
 */
export const getCurrentUser = (req: Request): User | null => {
  return req.user || null;
};

/**
 * Utility function to check if current user has role
 */
export const hasRole = (req: Request, role: string | string[]): boolean => {
  const user = getCurrentUser(req);
  if (!user) return false;

  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
};

/**
 * Utility function to check if current user is admin
 */
export const isAdmin = (req: Request): boolean => {
  return hasRole(req, 'Admin');
};

/**
 * Utility function to check if current user is manager or admin
 */
export const isManagerOrAdmin = (req: Request): boolean => {
  return hasRole(req, ['Admin', 'Manager']);
};