"use strict";
/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
exports.validateEnvironmentOrExit = validateEnvironmentOrExit;
/**
 * Validate environment variables
 */
function validateEnvironment() {
    const errors = [];
    const warnings = [];
    const isDevelopment = process.env.NODE_ENV !== 'production';
    // Always required variables
    const required = [
        'DATABASE_URL',
    ];
    // Firebase variables - required in production, optional in development
    const firebaseRequired = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL',
    ];
    // Check always required variables
    for (const key of required) {
        const value = process.env[key];
        if (!value || value.trim().length === 0) {
            errors.push(`Missing required environment variable: ${key}`);
        }
    }
    // Check Firebase variables - required in production, optional (with warning) in development
    for (const key of firebaseRequired) {
        const value = process.env[key];
        if (!value || value.trim().length === 0) {
            if (isDevelopment) {
                warnings.push(`Missing optional environment variable (Firebase features may not work): ${key}`);
            }
            else {
                errors.push(`Missing required environment variable: ${key}`);
            }
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
    // Validate Firebase private key format (should be a JSON string or path)
    if (process.env.FIREBASE_PRIVATE_KEY) {
        try {
            // Try to parse as JSON if it looks like JSON
            if (process.env.FIREBASE_PRIVATE_KEY.startsWith('{')) {
                JSON.parse(process.env.FIREBASE_PRIVATE_KEY);
            }
        }
        catch (e) {
            // If it's not JSON, it might be a file path - that's okay
            if (!process.env.FIREBASE_PRIVATE_KEY.includes('/') && !process.env.FIREBASE_PRIVATE_KEY.includes('\\')) {
                warnings.push('FIREBASE_PRIVATE_KEY format may be invalid');
            }
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
function validateEnvironmentOrExit() {
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
