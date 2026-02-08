import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { isSupportTeam, logAdminAccess } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/support-session
 * Creates a secure session cookie after successful Firebase authentication for support team
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token from Firebase Auth
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Verify user has support team role in Firestore
    const hasSupportRole = await isSupportTeam(uid);
    
    if (!hasSupportRole) {
      return NextResponse.json(
        { error: 'Unauthorized: Support team access required' },
        { status: 403 }
      );
    }

    // Privileged session cookie: keep lifetime short (absolute expiry).
    const expiresIn = 60 * 60 * 12 * 1000; // 12 hours in milliseconds
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('support_session', sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    // Log successful support login
    await logAdminAccess(uid, 'support_login', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    console.log(`✅ Support session created for user: ${uid}`);

    return NextResponse.json({ 
      success: true,
      message: 'Session created successfully'
    });

  } catch (error: any) {
    console.error('❌ Support session creation error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expired. Please sign in again.' },
        { status: 401 }
      );
    }
    
    if (error.code === 'auth/argument-error') {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/support-session
 * Logs out support user by deleting session cookie
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('support_session')?.value;

    if (sessionCookie) {
      try {
        // Verify and get user info before deleting
        const decodedToken = await auth.verifySessionCookie(sessionCookie);
        
        // Log support logout
        await logAdminAccess(decodedToken.uid, 'support_logout', {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
        });
        
        // Revoke refresh tokens for this user
        await auth.revokeRefreshTokens(decodedToken.uid);
        
      } catch (error) {
        // Continue even if verification fails (cookie might be expired)
        console.log('Session cookie verification failed during logout:', error);
      }
    }
    
    // Delete the session cookie
    cookieStore.delete('support_session');
    
    console.log('✅ Support session deleted');

    return NextResponse.json({ 
      success: true,
      message: 'Session ended successfully'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/support-session
 * Verify current session and return user info
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('support_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Verify the session cookie
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    
    // Check support role
    const hasSupportRole = await isSupportTeam(decodedToken.uid);
    
    if (!hasSupportRole) {
      return NextResponse.json(
        { error: 'Unauthorized: Support team access required' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
      }
    });

  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401 }
    );
  }
}

