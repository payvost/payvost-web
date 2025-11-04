import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from '@/lib/firebase-admin';
import { get2FAStatus } from '@/server/twoFactorService';

/**
 * GET /api/2fa/status
 * Get MFA status for the current user from Firebase Auth
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const status = await get2FAStatus(userId);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error getting 2FA status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get 2FA status' },
      { status: 500 }
    );
  }
}
