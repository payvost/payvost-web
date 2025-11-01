import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';
import { verifySessionCookie, isAdmin, logAdminAccess } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    // Authorization: verify session and admin role
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifySessionCookie(sessionCookie);
    const admin = await isAdmin(decoded.uid);
    
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    console.log('🔒 Revoking session:', sessionId);

    // Revoke the specific refresh token
    await auth.revokeRefreshTokens(decoded.uid);

    // Log the action
    await logAdminAccess(decoded.uid, 'session_revoked', {
      revokedSessionId: sessionId,
    });

    console.log(`✅ Session revoked for user: ${decoded.uid}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Session revoked successfully' 
    });
  } catch (error: any) {
    console.error('❌ Error revoking session:', error);
    return NextResponse.json(
      { error: 'Failed to revoke session', details: error.message },
      { status: 500 }
    );
  }
}
