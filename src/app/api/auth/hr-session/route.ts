import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { isHrAdmin } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if user has HR admin role
    const hasHrAdminRole = await isHrAdmin(uid);
    if (!hasHrAdminRole) {
      return NextResponse.json(
        { error: 'Unauthorized: HR Admin access required' },
        { status: 403 }
      );
    }

    // Create session cookie (expires in 14 days)
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set('hr_session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn / 1000, // Convert to seconds
      path: '/',
    });

    return NextResponse.json({
      success: true,
      uid,
    });
  } catch (error: any) {
    console.error('HR Session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    );
  }
}

