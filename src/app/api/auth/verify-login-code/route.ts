import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';

/**
 * POST /api/auth/verify-login-code
 * Verifies the login code and returns success if valid
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
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get stored code from Firestore
    const codeDoc = await db.collection('loginCodes').doc(uid).get();

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
      await db.collection('loginCodes').doc(uid).delete();
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check attempts (max 5 attempts)
    if (codeData.attempts >= 5) {
      // Delete code after too many attempts
      await db.collection('loginCodes').doc(uid).delete();
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify code
    if (codeData.code !== code) {
      // Increment attempts
      await db.collection('loginCodes').doc(uid).update({
        attempts: (codeData.attempts || 0) + 1,
      });

      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Code is valid - delete it
    await db.collection('loginCodes').doc(uid).delete();

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

