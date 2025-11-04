import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from '@/lib/firebase-admin';
import { recordMFAEnrollment } from '@/server/twoFactorService';

/**
 * POST /api/2fa/enable/authenticator
 * Record TOTP MFA enrollment in Firestore after client completes enrollment
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { displayName } = body;

    await recordMFAEnrollment(userId, 'totp', displayName || 'Authenticator App');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Authenticator 2FA enabled successfully' 
    });
  } catch (error: any) {
    console.error('Error recording authenticator enrollment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record enrollment' },
      { status: 500 }
    );
  }
}
