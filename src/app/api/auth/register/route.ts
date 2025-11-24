import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, admin } from '@/lib/firebase-admin';
import { rateLimit, getClientIP, registrationRateLimit } from '@/lib/rate-limit';
import { sanitizeEmail, sanitizeText, sanitizePhone } from '@/utils/sanitize';

const FieldValue = admin.firestore.FieldValue;

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'root', 'system', 'api', 'support', 'help',
  'info', 'contact', 'sales', 'marketing', 'legal', 'privacy', 'terms',
  'about', 'team', 'careers', 'blog', 'news', 'status', 'security',
  'payvost', 'payvostadmin', 'official', 'verify', 'verification'
];

/**
 * Check password strength - matches frontend validation
 * Requires at least 80% strength (8+ chars, uppercase, lowercase, number, special)
 */
function checkPasswordStrength(password: string): { valid: boolean; strength: number; message?: string } {
  let strength = 0;
  const checks = {
    length8: password.length >= 8,
    length12: password.length >= 12,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  if (checks.length8) strength += 20;
  if (checks.length12) strength += 20;
  if (checks.hasUpperCase) strength += 20;
  if (checks.hasLowerCase) strength += 20;
  if (checks.hasNumber) strength += 20;
  if (checks.hasSpecial) strength += 20;

  strength = Math.min(100, strength);

  if (strength < 80) {
    return {
      valid: false,
      strength,
      message: 'Password is not strong enough. It must be at least 8 characters and include uppercase, lowercase, number, and special characters.',
    };
  }

  return { valid: true, strength };
}

/**
 * Validate phone number format
 */
function validatePhoneNumber(phone: string, countryCode?: string): boolean {
  // Basic validation - phone should contain only digits and optional + prefix
  const cleaned = phone.replace(/[\s-()]/g, '');
  if (!cleaned.match(/^\+?[1-9]\d{4,14}$/)) {
    return false;
  }
  
  // Additional country-specific validation can be added here
  // For now, we accept E.164 format
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Ensure Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error('[Register API] Firebase Admin SDK not initialized');
      return NextResponse.json(
        { 
          error: 'Service unavailable', 
          message: 'Registration service is temporarily unavailable. Please try again in a few moments.' 
        },
        { status: 503 }
      );
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(
      `register:${clientIP}`,
      registrationRateLimit.windowMs,
      registrationRateLimit.maxRequests
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many registration attempts',
          message: `You have exceeded the registration limit. Please try again after ${Math.ceil(rateLimitResult.retryAfter! / 60)} minutes.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 3600),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          },
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('[Register API] Failed to parse request body:', jsonError);
      return NextResponse.json(
        { error: 'Invalid request', message: 'Invalid JSON in request body.' },
        { status: 400 }
      );
    }

    let { email, password, displayName, phoneNumber, countryCode, userType, username } = body;

    // Sanitize inputs
    email = sanitizeEmail(email || '');
    displayName = sanitizeText(displayName || '');
    phoneNumber = phoneNumber ? sanitizePhone(phoneNumber) : '';
    countryCode = countryCode ? sanitizeText(countryCode).toUpperCase().slice(0, 2) : '';
    username = username ? sanitizeText(username).toLowerCase().trim() : '';

    // Validate required fields
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Email, password, and display name are required.' },
        { status: 400 }
      );
    }

    // Validate email format (sanitizeEmail already does this, but double-check)
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email format', message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Validate password strength (match frontend validation)
    const passwordValidation = checkPasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Weak password', message: passwordValidation.message },
        { status: 400 }
      );
    }

    // Validate username if provided
    if (username) {
      if (username.length < 3) {
        return NextResponse.json(
          { error: 'Invalid username', message: 'Username must be at least 3 characters long.' },
          { status: 400 }
        );
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json(
          { error: 'Invalid username', message: 'Username can only contain letters, numbers, and underscores.' },
          { status: 400 }
        );
      }

      if (RESERVED_USERNAMES.includes(username)) {
        return NextResponse.json(
          { error: 'Reserved username', message: 'This username is reserved and cannot be used.' },
          { status: 400 }
        );
      }

      // Check if username already exists
      const usernameQuery = await adminDb
        .collection('users')
        .where('username', '==', username)
        .limit(1)
        .get();

      if (!usernameQuery.empty) {
        return NextResponse.json(
          { error: 'Username taken', message: 'This username is already taken. Please choose another.' },
          { status: 409 }
        );
      }
    }

    // Validate phone number format if provided (non-blocking - we'll store it even if format is slightly off)
    if (phoneNumber && !validatePhoneNumber(phoneNumber, countryCode)) {
      console.warn('[Register API] Phone number format validation failed, but continuing registration:', {
        phoneNumber: phoneNumber.substring(0, 5) + '...',
        countryCode,
      });
      // Don't block registration for phone number format issues - just log a warning
      // Phone number will still be stored in Firestore
    }

    // Create user with Firebase Admin SDK (bypasses client restrictions)
    // Note: phoneNumber is not set during user creation to avoid issues if phone verification is not enabled
    // Phone number will be stored in Firestore instead
    let userRecord;
    try {
      const createUserParams: {
        email: string;
        password: string;
        displayName: string;
        emailVerified: boolean;
        phoneNumber?: string;
      } = {
        email,
        password,
        displayName,
        emailVerified: false,
      };
      
      // Only include phoneNumber if it's valid and phone verification is expected to be enabled
      // For now, we'll skip phoneNumber in Auth and store it in Firestore only
      // This avoids errors if phone verification is not configured in Firebase Console
      
      userRecord = await adminAuth.createUser(createUserParams);
    } catch (authError: unknown) {
      const authErrorDetails = authError as { code?: string; message?: string };
      console.error('[Register API] Firebase Auth user creation failed:', {
        code: authErrorDetails?.code,
        message: authErrorDetails?.message,
        email: email.substring(0, 5) + '...', // Log partial email for debugging
      });
      // Re-throw to be handled by outer catch
      throw authError;
    }

    // Create user document in Firestore (minimal initial document - frontend will update with full details)
    try {
      const userDocData = {
        uid: userRecord.uid,
        email,
        displayName,
        phoneNumber: phoneNumber || '',
        country: '',
        countryCode: countryCode || '',
        username: username || '',
        userType: userType || 'Pending',
        kycStatus: 'unverified',
        kycLevel: null,
        riskScore: 0,
        totalSpend: 0,
        wallets: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await adminDb.collection('users').doc(userRecord.uid).set(userDocData);
      console.log('[Register API] User document created successfully in Firestore');
    } catch (firestoreError: unknown) {
      const firestoreErrorDetails = firestoreError as { code?: string; message?: string; stack?: string };
      console.error('[Register API] Firestore write failed:', {
        code: firestoreErrorDetails?.code,
        message: firestoreErrorDetails?.message,
        uid: userRecord.uid,
        stack: process.env.NODE_ENV === 'development' ? firestoreErrorDetails?.stack : undefined,
      });
      
      // Try to clean up the created user if Firestore write fails
      try {
        await adminAuth.deleteUser(userRecord.uid);
        console.log('[Register API] Cleaned up user after Firestore failure');
      } catch (cleanupError) {
        console.error('[Register API] Failed to clean up user after Firestore failure:', cleanupError);
      }
      
      // Re-throw to be handled by outer catch
      throw firestoreError;
    }

    // Generate custom token for immediate sign-in
    let customToken;
    try {
      customToken = await adminAuth.createCustomToken(userRecord.uid);
    } catch (tokenError: unknown) {
      const tokenErrorDetails = tokenError as { code?: string; message?: string };
      console.error('[Register API] Custom token generation failed:', {
        code: tokenErrorDetails?.code,
        message: tokenErrorDetails?.message,
        uid: userRecord.uid,
      });
      // Re-throw to be handled by outer catch
      throw tokenError;
    }

    return NextResponse.json(
      {
        success: true,
        uid: userRecord.uid,
        customToken,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.resetTime),
        },
      }
    );
  } catch (error: unknown) {
    // Improved error handling - don't expose internal details
    const errorDetails = error as { code?: string; message?: string; stack?: string };
    const errorCode = errorDetails?.code;
    const errorMessage = errorDetails?.message || 'An unexpected error occurred';

    // Log error for debugging (server-side only)
    console.error('[Register API] User creation error:', {
      code: errorCode,
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorDetails?.stack : undefined,
      timestamp: new Date().toISOString(),
      errorType: errorDetails?.constructor?.name || typeof error,
      // Log full error object in development
      ...(process.env.NODE_ENV === 'development' && { fullError: errorDetails }),
    });

    // Handle specific Firebase errors with user-friendly messages
    if (errorCode === 'auth/email-already-exists' || errorCode === 'auth/email-already-in-use') {
      return NextResponse.json(
        { error: 'Email already registered', message: 'An account with this email already exists. Please use a different email or try logging in.' },
        { status: 409 }
      );
    }

    if (errorCode === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email format', message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (errorCode === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Weak password', message: 'Password does not meet security requirements. Please use a stronger password.' },
        { status: 400 }
      );
    }

    if (errorCode === 'auth/operation-not-allowed') {
      return NextResponse.json(
        { error: 'Registration disabled', message: 'Registration is currently disabled. Please contact support.' },
        { status: 503 }
      );
    }

    // Check for Firebase Admin initialization errors
    if (errorMessage.includes('Firebase Admin') || errorMessage.includes('admin') || errorCode?.includes('app/no-app')) {
      console.error('[Register API] Firebase Admin initialization error');
      return NextResponse.json(
        { error: 'Service unavailable', message: 'Registration service is temporarily unavailable. Please try again in a few moments.' },
        { status: 503 }
      );
    }

    // Check for Firestore errors
    if (errorCode?.includes('firestore') || errorCode?.includes('permission') || errorMessage.includes('permission')) {
      console.error('[Register API] Firestore error');
      return NextResponse.json(
        { error: 'Database error', message: 'Unable to save your information. Please try again later.' },
        { status: 500 }
      );
    }

    // Generic error response (don't expose internal error details)
    return NextResponse.json(
      { 
        error: 'Registration failed', 
        message: 'Unable to create your account at this time. Please try again later.',
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}
