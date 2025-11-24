import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

/**
 * POST /api/auth/verify-login-code
 * Verifies the login code and returns success if valid
 * 
 * @deprecated This endpoint is no longer used. Login now uses Firebase email verification links instead.
 * Kept for potential future use when Mailgun account is reactivated.
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken, code } = await request.json();

    if (!idToken || !code) {
      return NextResponse.json(
        { error: 'ID token and code are required' },
        { status: 400 }
      );
    }

    // Verify the ID token to get user info
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get stored code from Firestore
    const codeDoc = await adminDb.collection('loginCodes').doc(uid).get();

    if (!codeDoc.exists) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    const codeData = codeDoc.data()!;
    const now = new Date();
    const expiresAt = codeData.expiresAt.toDate();

    // Check if code has expired
    if (now > expiresAt) {
      // Delete expired code
      await adminDb.collection('loginCodes').doc(uid).delete();
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check attempts (max 5 attempts)
    if (codeData.attempts >= 5) {
      // Delete code after too many attempts
      await adminDb.collection('loginCodes').doc(uid).delete();
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify code
    if (codeData.code !== code) {
      // Increment attempts
      await adminDb.collection('loginCodes').doc(uid).update({
        attempts: (codeData.attempts || 0) + 1,
      });

      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Code is valid - delete it
    await adminDb.collection('loginCodes').doc(uid).delete();

    console.log(`✅ Login code verified successfully for user ${uid}`);

    return NextResponse.json({
      success: true,
      message: 'Code verified successfully',
    });

  } catch (error: any) {
    console.error('❌ Error verifying login code:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to verify code',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

