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

    // Privileged session cookie: shorter absolute expiry.
    const expiresIn = 60 * 60 * 12 * 1000; // 12 hours
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set('hr_session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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

/**
 * DELETE /api/auth/hr-session
 * Logs out HR user by deleting session cookie and revoking refresh tokens.
 */
export async function DELETE(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hr_session')?.value;
    if (sessionCookie) {
      try {
        const decoded = await auth.verifySessionCookie(sessionCookie);
        await auth.revokeRefreshTokens(decoded.uid);
      } catch {
        // Ignore verification errors (cookie may already be expired).
      }
    }
    cookieStore.delete('hr_session');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('HR logout error:', error);
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  }
}

/**
 * GET /api/auth/hr-session
 * Verify current HR session.
 */
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hr_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'No active session' }, { status: 401 });

    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const ok = await isHrAdmin(decoded.uid);
    if (!ok) return NextResponse.json({ error: 'Unauthorized: HR Admin access required' }, { status: 403 });

    return NextResponse.json({ success: true, user: { uid: decoded.uid, email: decoded.email } });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }
}

