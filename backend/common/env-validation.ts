/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string;
  DIRECT_URL?: string;
  
  // Firebase Admin (preferred: single service account JSON, optionally base64 encoded)
  FIREBASE_SERVICE_ACCOUNT_KEY?: string;
  FIREBASE_SERVICE_ACCOUNT_KEY_BASE64?: string;
  FIREBASE_DATABASE_URL?: string;
  
  // API Configuration
  PORT?: string;
  NODE_ENV?: string;
  FRONTEND_URL?: string;
  
  // Payment Providers
  RAPYD_ACCESS_KEY?: string;
  RAPYD_SECRET_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  PAYSTACK_SECRET_KEY?: string;
  FLUTTERWAVE_SECRET_KEY?: string;
  
  // Email/SMS
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  
  // Internal Services
  INTERNAL_API_KEY?: string;
  CORE_BANKING_SERVICE_API_KEY?: string;
  
  // Optional but recommended
  REDIS_URL?: string;
  SENTRY_DSN?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Always required variables
  const required: Array<keyof EnvConfig> = [
    'DATABASE_URL',
  ];
  
  // Check always required variables
  for (const key of required) {
    const value = process.env[key];
    if (!value || value.trim().length === 0) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Firebase Admin credentials:
  // - In production: must be present (as JSON string or base64 JSON).
  // - In development: warn only (local key file can be used instead).
  const hasServiceAccountJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  const hasServiceAccountB64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64?.trim();
  if (!hasServiceAccountJson && !hasServiceAccountB64) {
    if (isDevelopment) {
      warnings.push(
        'Missing FIREBASE_SERVICE_ACCOUNT_KEY/FIREBASE_SERVICE_ACCOUNT_KEY_BASE64. Firebase Admin features may not work unless a local service account file is present.'
      );
    } else {
      errors.push('Missing required Firebase Admin credentials: FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_BASE64');
    }
  } else {
    // If present, ensure it parses as JSON (after base64 decode if needed).
    try {
      const raw = hasServiceAccountJson
        ? (process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)
        : Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 as string, 'base64').toString('utf8');
      JSON.parse(raw);
    } catch {
      errors.push('Firebase Admin credentials are not valid JSON (check FIREBASE_SERVICE_ACCOUNT_KEY / FIREBASE_SERVICE_ACCOUNT_KEY_BASE64)');
    }
  }
  
  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  // Validate PORT if provided
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('PORT must be a valid number between 1 and 65535');
    }
  }
  
  // Validate NODE_ENV
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    warnings.push(`NODE_ENV should be 'development', 'production', or 'test', got: ${process.env.NODE_ENV}`);
  }
  
  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FRONTEND_URL) {
      errors.push('FRONTEND_URL is required in production environment');
    }
    
    if (!process.env.RAPYD_SECRET_KEY && !process.env.STRIPE_SECRET_KEY) {
      warnings.push('No payment provider credentials found. Payment features may not work.');
    }
    
    if (!process.env.MAILGUN_API_KEY && !process.env.TWILIO_ACCOUNT_SID) {
      warnings.push('No email/SMS provider credentials found. Notifications may not work.');
    }
    
    if (!process.env.INTERNAL_API_KEY && !process.env.CORE_BANKING_SERVICE_API_KEY) {
      warnings.push('No internal API key configured. Internal service communication may be insecure.');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate and exit if invalid (for startup)
 */
export function validateEnvironmentOrExit(): void {
  const result = validateEnvironment();
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment variable warnings:');
    result.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (!result.valid) {
    console.error('❌ Environment variable validation failed:');
    result.errors.forEach(error => console.error(`   - ${error}`));
    console.error('\nPlease set the required environment variables and try again.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated successfully');
}

