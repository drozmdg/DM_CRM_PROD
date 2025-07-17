/**
 * Authentication Configuration and Validation
 * Centralized configuration for authentication settings
 */

export interface AuthConfig {
  // JWT Configuration
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  
  // Password Policy
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  
  // Rate Limiting
  loginMaxAttempts: number;
  loginWindowMs: number;
  registrationMaxAttempts: number;
  registrationWindowMs: number;
  
  // Session Management
  sessionTimeoutMs: number;
  maxActiveSessions: number;
  
  // Security Settings
  requireEmailVerification: boolean;
  requireMfaForAdmins: boolean;
  allowPasswordReset: boolean;
  
  // Environment
  isProduction: boolean;
  frontendUrl: string;
}

/**
 * Get authentication configuration from environment variables
 */
export function getAuthConfig(): AuthConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // JWT Configuration
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    
    // Password Policy
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    passwordRequireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    passwordRequireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS !== 'false',
    
    // Rate Limiting
    loginMaxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5'),
    loginWindowMs: parseInt(process.env.LOGIN_WINDOW_MS || '900000'), // 15 minutes
    registrationMaxAttempts: parseInt(process.env.REGISTRATION_MAX_ATTEMPTS || '3'),
    registrationWindowMs: parseInt(process.env.REGISTRATION_WINDOW_MS || '600000'), // 10 minutes
    
    // Session Management
    sessionTimeoutMs: parseInt(process.env.SESSION_TIMEOUT_MS || '3600000'), // 1 hour
    maxActiveSessions: parseInt(process.env.MAX_ACTIVE_SESSIONS || '5'),
    
    // Security Settings
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true' || isProduction,
    requireMfaForAdmins: process.env.REQUIRE_MFA_FOR_ADMINS === 'true' || isProduction,
    allowPasswordReset: process.env.ALLOW_PASSWORD_RESET !== 'false',
    
    // Environment
    isProduction,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  };
}

/**
 * Validate authentication configuration
 */
export function validateAuthConfig(): void {
  const config = getAuthConfig();
  const errors: string[] = [];
  
  // Production-specific validations
  if (config.isProduction) {
    if (config.jwtSecret === 'dev-secret-change-in-production') {
      errors.push('JWT_SECRET must be set to a secure value in production');
    }
    
    if (config.jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }
    
    if (!config.requireEmailVerification) {
      errors.push('Email verification should be enabled in production');
    }
  }
  
  // General validations
  if (config.passwordMinLength < 8) {
    errors.push('Password minimum length should be at least 8 characters');
  }
  
  if (config.loginMaxAttempts < 1) {
    errors.push('Login max attempts must be at least 1');
  }
  
  if (config.sessionTimeoutMs < 300000) { // 5 minutes minimum
    errors.push('Session timeout should be at least 5 minutes');
  }
  
  if (!config.frontendUrl.startsWith('http')) {
    errors.push('FRONTEND_URL must be a valid URL');
  }
  
  // Throw error if any validation fails
  if (errors.length > 0) {
    throw new Error(
      `Authentication configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
}

/**
 * Log authentication configuration (without sensitive data)
 */
export function logAuthConfig(): void {
  const config = getAuthConfig();
  
  console.log('🔐 Authentication Configuration:');
  console.log(`  Environment: ${config.isProduction ? 'Production' : 'Development'}`);
  console.log(`  Password Min Length: ${config.passwordMinLength}`);
  console.log(`  Login Rate Limit: ${config.loginMaxAttempts} attempts per ${config.loginWindowMs/1000}s`);
  console.log(`  Email Verification: ${config.requireEmailVerification ? 'Enabled' : 'Disabled'}`);
  console.log(`  MFA for Admins: ${config.requireMfaForAdmins ? 'Required' : 'Optional'}`);
  console.log(`  Session Timeout: ${config.sessionTimeoutMs/1000}s`);
  console.log(`  Frontend URL: ${config.frontendUrl}`);
}

// Validate configuration on module load
validateAuthConfig();