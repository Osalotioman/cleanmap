/**
 * Centralized Environment Variable Validation
 * 
 * This module validates all required environment variables at application startup.
 * It will throw an error if any required variable is missing, preventing runtime errors.
 * 
 * Usage:
 * - Import `env` from this file to access validated environment variables
 * - Call `validateEnv()` at app initialization (e.g., in root layout or middleware)
 * 
 * @module lib/env
 */

interface EnvConfig {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;

  // Database Configuration
  DATABASE_URL: string;

  // Application Configuration
  APP_JWT_SECRET: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Validates that a required environment variable exists and is not empty
 * @param key - The environment variable name
 * @param value - The environment variable value
 * @throws Error if the variable is missing or empty
 */
function validateRequired(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `❌ Missing required environment variable: ${key}\n` +
      `Please add it to your .env.local file or deployment environment.`
    );
  }
  return value.trim();
}

/**
 * Validates that a URL is properly formatted
 * @param key - The environment variable name
 * @param value - The URL value
 * @throws Error if the URL is invalid
 */
function validateUrl(key: string, value: string): string {
  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(
      `❌ Invalid URL format for ${key}: ${value}\n` +
      `Expected format: https://example.com`
    );
  }
}

/**
 * Validates the NODE_ENV value
 * @param value - The NODE_ENV value
 * @returns Valid environment string
 */
function validateNodeEnv(value: string | undefined): 'development' | 'production' | 'test' {
  const validEnvs = ['development', 'production', 'test'];
  const env = value || 'development';
  
  if (!validEnvs.includes(env)) {
    console.warn(`⚠️  Invalid NODE_ENV: ${env}. Defaulting to 'development'`);
    return 'development';
  }
  
  return env as 'development' | 'production' | 'test';
}

/**
 * Main validation function that checks all required environment variables
 * @throws Error if any required variable is missing or invalid
 */
export function validateEnv(): void {
  const errors: string[] = [];

  try {
    // Validate Supabase variables
    validateRequired('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
    validateUrl('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL!);
    validateRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    validateRequired('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
    validateRequired('SUPABASE_JWT_SECRET', process.env.SUPABASE_JWT_SECRET);

    // Validate Database URL
    validateRequired('DATABASE_URL', process.env.DATABASE_URL);

    // Validate App JWT Secret
    const appSecret = validateRequired('APP_JWT_SECRET', process.env.APP_JWT_SECRET);
    if (appSecret.length < 32) {
      errors.push(
        '⚠️  APP_JWT_SECRET should be at least 32 characters long for security.\n' +
        '   Generate a strong secret using: openssl rand -base64 32'
      );
    }

    if (errors.length > 0) {
      console.error('\n' + errors.join('\n') + '\n');
    }

    console.log('✅ All environment variables validated successfully');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        '\n' +
        '═══════════════════════════════════════════════════════════\n' +
        '  ENVIRONMENT CONFIGURATION ERROR\n' +
        '═══════════════════════════════════════════════════════════\n\n' +
        error.message +
        '\n\n' +
        'Required environment variables:\n' +
        '  - NEXT_PUBLIC_SUPABASE_URL\n' +
        '  - NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
        '  - SUPABASE_SERVICE_ROLE_KEY\n' +
        '  - SUPABASE_JWT_SECRET\n' +
        '  - DATABASE_URL\n' +
        '  - APP_JWT_SECRET\n\n' +
        'See .github/AUTH_IMPLEMENTATION.md for setup instructions.\n' +
        '═══════════════════════════════════════════════════════════\n'
      );
    }
    throw error;
  }
}

/**
 * Typed and validated environment configuration
 * Use this object to access environment variables throughout the application
 */
export const env: EnvConfig = {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET!,

  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL!,

  // Application Configuration
  APP_JWT_SECRET: process.env.APP_JWT_SECRET!,
  NODE_ENV: validateNodeEnv(process.env.NODE_ENV),
};

/**
 * Helper function to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper function to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper function to check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test';
