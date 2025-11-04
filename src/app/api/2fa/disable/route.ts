import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from '@/lib/firebase-admin';
import { recordMFAUnenrollment } from '@/server/twoFactorService';

/**
 * POST /api/2fa/disable
 * Record MFA unenrollment in Firestore
 * Actual unenrollment must be done on client using multiFactor(user).unenroll()
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

    await recordMFAUnenrollment(userId);
    
    return NextResponse.json({ 
      success: true, 
      message: '2FA disabled successfully' 
    });
  } catch (error: any) {
    console.error('Error recording MFA unenrollment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record unenrollment' },
      { status: 500 }
    );
  }
}
