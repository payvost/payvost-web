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

    const body = await request.json();
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

    // Validate phone number format if provided
    if (phoneNumber && !validatePhoneNumber(phoneNumber, countryCode)) {
      return NextResponse.json(
        { error: 'Invalid phone number', message: 'Please provide a valid phone number in international format.' },
        { status: 400 }
      );
    }

    // Create user with Firebase Admin SDK (bypasses client restrictions)
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      phoneNumber: phoneNumber || undefined,
      emailVerified: false,
    });

    // Create user document in Firestore (minimal initial document - frontend will update with full details)
    await adminDb.collection('users').doc(userRecord.uid).set({
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
    });

    // Generate custom token for immediate sign-in
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

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
    const errorDetails = error as { code?: string; message?: string };
    const errorCode = errorDetails?.code;
    const errorMessage = errorDetails?.message || 'An unexpected error occurred';

    // Log error for debugging (server-side only)
    console.error('[Register API] User creation error:', {
      code: errorCode,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });

    // Handle specific Firebase errors with user-friendly messages
    if (errorCode === 'auth/email-already-exists') {
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

    // Generic error response (don't expose internal error details)
    return NextResponse.json(
      { error: 'Registration failed', message: 'Unable to create your account at this time. Please try again later.' },
      { status: 500 }
    );
  }
}
