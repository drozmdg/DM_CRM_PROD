/**
 * Input Validation and Sanitization Middleware
 * Comprehensive protection against XSS, injection attacks, and malformed input
 */

import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { fromZodError } from 'zod-validation-error';

/**
 * HTML/XSS sanitization utility
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove vbscript: protocols
    .replace(/vbscript:/gi, '')
    // Remove onXXX event handlers
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    // Remove data URLs with scripts
    .replace(/data:.*script.*,/gi, '')
    // Remove expression() CSS
    .replace(/expression\s*\(/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deep sanitize object properties
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key names too
      const cleanKey = sanitizeString(key);
      sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * SQL injection detection patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\bunion\b.*\bselect\b)|(\bselect\b.*\bunion\b)/i,
  /\b(select|insert|update|delete|drop|create|alter|exec|execute|sp_|xp_)\b/i,
  /(\b(or|and)\b\s+.*(=|like|in)\s*.*(\b(select|insert|update|delete)\b))/i,
  /('|\")(\s*;\s*)(\w+)/i,
  /(\b(concat|char|ascii|substring|length|database|version|user|system_user)\b\s*\()/i,
  /(\-\-|\#|\/\*|\*\/)/,
  /(\bwaitfor\b|\bdelay\b)/i,
  /(\bbenchmark\b|\bsleep\b)/i
];

/**
 * XSS detection patterns
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<applet/gi,
  /<meta/gi,
  /<link/gi,
  /expression\s*\(/gi,
  /data:.*script/gi,
  /@import/gi,
  /binding\s*:/gi
];

/**
 * Path traversal detection
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\g/,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi
];

/**
 * Detect potential security threats in input
 */
export function detectSecurityThreats(input: string): string[] {
  const threats: string[] = [];
  
  // Check for SQL injection
  if (SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input))) {
    threats.push('SQL_INJECTION');
  }
  
  // Check for XSS
  if (XSS_PATTERNS.some(pattern => pattern.test(input))) {
    threats.push('XSS');
  }
  
  // Check for path traversal
  if (PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input))) {
    threats.push('PATH_TRAVERSAL');
  }
  
  return threats;
}

/**
 * Enhanced Zod string schema with security validation
 */
export const secureString = (maxLength: number = 1000) => 
  z.string()
    .max(maxLength, `String must be ${maxLength} characters or less`)
    .refine((value) => {
      const threats = detectSecurityThreats(value);
      return threats.length === 0;
    }, {
      message: "Input contains potentially dangerous content"
    })
    .transform((value) => sanitizeString(value));

/**
 * Email validation with enhanced security
 */
export const secureEmail = z.string()
  .email('Invalid email format')
  .max(254, 'Email must be 254 characters or less')
  .refine((value) => {
    // Additional email security checks
    return !detectSecurityThreats(value).length;
  }, {
    message: "Email contains invalid characters"
  });

/**
 * URL validation with security checks
 */
export const secureUrl = z.string()
  .url('Invalid URL format')
  .max(2048, 'URL must be 2048 characters or less')
  .refine((value) => {
    // Only allow HTTP and HTTPS protocols
    return value.startsWith('https://') || value.startsWith('http://');
  }, {
    message: "Only HTTP and HTTPS URLs are allowed"
  })
  .refine((value) => {
    return !detectSecurityThreats(value).length;
  }, {
    message: "URL contains potentially dangerous content"
  });

/**
 * File name validation
 */
export const secureFilename = z.string()
  .max(255, 'Filename must be 255 characters or less')
  .refine((value) => {
    // Check for dangerous characters
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    return !dangerousChars.test(value);
  }, {
    message: "Filename contains invalid characters"
  })
  .refine((value) => {
    // Check for reserved names (Windows)
    const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;
    return !reservedNames.test(value);
  }, {
    message: "Filename uses a reserved name"
  })
  .refine((value) => {
    return !PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(value));
  }, {
    message: "Filename contains path traversal attempts"
  });

/**
 * Validation middleware factory
 */
export function validateInput<T>(schema: z.ZodSchema<T>, target: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      
      // Pre-sanitize the data
      const sanitizedData = sanitizeObject(data);
      
      // Validate with Zod schema
      const validatedData = await schema.parseAsync(sanitizedData);
      
      // Replace the request data with validated and sanitized data
      req[target] = validatedData;
      
      next();
    } catch (error) {
      console.error('Validation error:', error);
      
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationError.details,
          code: 'VALIDATION_ERROR'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid input data',
          code: 'INVALID_INPUT'
        });
      }
    }
  };
}

/**
 * Security scanning middleware
 */
export function securityScan(req: Request, res: Response, next: NextFunction) {
  const threats: string[] = [];
  
  // Scan URL
  if (req.url) {
    threats.push(...detectSecurityThreats(req.url));
  }
  
  // Scan headers
  Object.values(req.headers).forEach(header => {
    if (typeof header === 'string') {
      threats.push(...detectSecurityThreats(header));
    }
  });
  
  // Scan body if it's a string or contains strings
  if (req.body) {
    const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    threats.push(...detectSecurityThreats(bodyStr));
  }
  
  if (threats.length > 0) {
    console.warn('🚨 Security threats detected:', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      threats: [...new Set(threats)],
      timestamp: new Date().toISOString()
    });
    
    res.status(400).json({
      success: false,
      error: 'Request contains potentially dangerous content',
      code: 'SECURITY_THREAT_DETECTED'
    });
    return;
  }
  
  next();
}

/**
 * Enhanced error handler for validation errors
 */
export function validationErrorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  if (error instanceof z.ZodError) {
    const validationError = fromZodError(error);
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationError.details,
      code: 'VALIDATION_ERROR'
    });
    return;
  }
  
  next(error);
}

/**
 * Content-Type validation middleware
 */
export function validateContentType(allowedTypes: string[] = ['application/json']) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }
    
    const contentType = req.get('Content-Type');
    if (!contentType) {
      res.status(400).json({
        success: false,
        error: 'Content-Type header is required',
        code: 'MISSING_CONTENT_TYPE'
      });
      return;
    }
    
    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    if (!isAllowed) {
      res.status(415).json({
        success: false,
        error: `Unsupported Content-Type. Allowed types: ${allowedTypes.join(', ')}`,
        code: 'UNSUPPORTED_CONTENT_TYPE'
      });
      return;
    }
    
    next();
  };
}

/**
 * Request size validation middleware
 */
export function validateRequestSize(maxSize: number = 10 * 1024 * 1024) { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      res.status(413).json({
        success: false,
        error: `Request too large. Maximum size: ${maxSize} bytes`,
        code: 'REQUEST_TOO_LARGE'
      });
      return;
    }
    
    next();
  };
}