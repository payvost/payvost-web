import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { isWriter } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/writer-session
 * Creates a secure session cookie after successful Firebase authentication for writers
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

    // Verify user has writer role in Firestore
    const hasWriterRole = await isWriter(uid);
    
    if (!hasWriterRole) {
      return NextResponse.json(
        { error: 'Unauthorized: Writer access required' },
        { status: 403 }
      );
    }

    // Create session cookie (expires in 14 days)
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('writer_session', sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    console.log(`✅ Writer session created for user: ${uid}`);

    return NextResponse.json({ 
      success: true,
      message: 'Session created successfully'
    });

  } catch (error: any) {
    console.error('❌ Writer session creation error:', error);
    
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
      { error: 'Failed to create session', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/writer-session
 * Logs out writer user by deleting session cookie
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('writer_session')?.value;

    if (sessionCookie) {
      try {
        // Verify and get user info before deleting
        const decodedToken = await auth.verifySessionCookie(sessionCookie);
        
        // Revoke refresh tokens for this user
        await auth.revokeRefreshTokens(decodedToken.uid);
        
      } catch (error) {
        // Continue even if verification fails (cookie might be expired)
        console.log('Session cookie verification failed during logout:', error);
      }
    }
    
    // Delete the session cookie
    cookieStore.delete('writer_session');
    
    console.log('✅ Writer session deleted');

    return NextResponse.json({ 
      success: true,
      message: 'Session ended successfully'
    });

  } catch (error) {
    console.error('❌ Writer logout error:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/writer-session
 * Verify current session and return user info
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('writer_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Verify the session cookie
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    
    // Check writer role
    const hasWriterRole = await isWriter(decodedToken.uid);
    
    if (!hasWriterRole) {
      return NextResponse.json(
        { error: 'Unauthorized: Writer access required' },
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
    console.error('Writer session verification error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401 }
    );
  }
}

