import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from '@/lib/firebase-admin';

/**
 * POST /api/2fa/setup/authenticator
 * Returns instructions for TOTP setup
 * Actual enrollment happens on the client using Firebase multiFactor() API
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);

    return NextResponse.json({
      message: 'Use client-side Firebase multiFactor() API to enroll TOTP',
      instructions: 'Call multiFactor(user).enroll() on the client with TotpMultiFactorGenerator',
    });
  } catch (error: any) {
    console.error('Error in authenticator setup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to setup authenticator' },
      { status: 500 }
    );
  }
}
