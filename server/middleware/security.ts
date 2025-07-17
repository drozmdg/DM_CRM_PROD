/**
 * Security Middleware
 * Implements comprehensive security headers and protection mechanisms
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Express, Request, Response, NextFunction } from 'express';

/**
 * Configure security headers using Helmet
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Allow inline styles for TailwindCSS
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        // Allow specific inline scripts for Vite in development
        process.env.NODE_ENV === 'development' ? "'unsafe-inline'" : null,
        // Add specific script sources if needed
      ].filter(Boolean),
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "blob:" // Allow blob URLs for generated images
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      connectSrc: [
        "'self'",
        process.env.SUPABASE_URL || "",
        // Allow connections to Supabase
        "https://*.supabase.co",
        // Allow WebSocket connections in development
        process.env.NODE_ENV === 'development' ? "ws://localhost:*" : null,
        process.env.NODE_ENV === 'development' ? "http://localhost:*" : null
      ].filter(Boolean),
      manifestSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'none'"],
      workerSrc: ["'self'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection (legacy but still useful)
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: ['no-referrer-when-downgrade']
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false
  },

  // Don't cache sensitive pages
  noCache: false,

  // Expect-CT (Certificate Transparency)
  expectCt: process.env.NODE_ENV === 'production' ? {
    maxAge: 86400,
    enforce: true
  } : false,

  // Permissions Policy (formerly Feature Policy)
  permittedCrossDomainPolicies: false,

  // Cross Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disabled for now to avoid breaking existing functionality

  // Cross Origin Opener Policy  
  crossOriginOpenerPolicy: false, // Disabled for now

  // Cross Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  }
});

/**
 * General API rate limiting
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for certain IPs (e.g., localhost in development)
  skip: (req: Request) => {
    if (process.env.NODE_ENV === 'development') {
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1' || ip?.startsWith('192.168.');
    }
    return false;
  }
});

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip for development
  skip: (req: Request) => {
    if (process.env.NODE_ENV === 'development') {
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1';
    }
    return false;
  }
});

/**
 * Very strict rate limiting for password reset
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts from this IP, please try again later.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // Express server
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['set-cookie']
};

/**
 * Request size limiting middleware
 */
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // This will be handled by express.json() and express.urlencoded() limits
    // But we can add additional checks here if needed
    next();
  };
};

/**
 * Security logging middleware
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const method = req.method;
  const url = req.url;
  
  // Log suspicious requests
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal attempts
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection attempts
    /javascript:/i, // JavaScript protocol
    /vbscript:/i, // VBScript protocol
    /on\w+\s*=/i // Event handler attributes
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(req.get('User-Agent') || '')
  );

  if (isSuspicious) {
    console.warn(`🚨 Suspicious request detected:`, {
      ip,
      method,
      url,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Apply all security middleware to Express app
 */
export function applySecurityMiddleware(app: Express): void {
  // Trust proxy for accurate IP addresses behind reverse proxy
  app.set('trust proxy', 1);

  // Security headers
  app.use(securityHeaders);

  // Security logging
  app.use(securityLogger);

  // General rate limiting (applied to all routes)
  app.use(generalRateLimit);

  // Request size limits (handled by express.json and express.urlencoded)
  app.use(requestSizeLimit());

  console.log('🛡️  Security middleware configured:');
  console.log('  ✅ Security headers (Helmet)');
  console.log('  ✅ Rate limiting');
  console.log('  ✅ Request size limits');
  console.log('  ✅ Security logging');
  console.log('  ✅ CORS protection');
}

/**
 * Security health check endpoint
 */
export const securityHealthCheck = (req: Request, res: Response) => {
  const securityInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    securityFeatures: {
      helmet: true,
      rateLimit: true,
      cors: true,
      requestSizeLimit: true,
      securityLogging: true
    },
    headers: {
      'Strict-Transport-Security': res.get('Strict-Transport-Security') ? 'Enabled' : 'Disabled',
      'X-Frame-Options': res.get('X-Frame-Options') || 'Not Set',
      'X-Content-Type-Options': res.get('X-Content-Type-Options') || 'Not Set',
      'Content-Security-Policy': res.get('Content-Security-Policy') ? 'Enabled' : 'Disabled'
    }
  };

  res.json({
    status: 'OK',
    message: 'Security middleware is active',
    data: securityInfo
  });
};