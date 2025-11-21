import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';
import { verifySessionCookie, isAdmin, logAdminAccess } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log(`🔒 Force logging out user: ${userId}`);

    // Revoke all refresh tokens for the user
    await auth.revokeRefreshTokens(userId);

    // Log the action
    await logAdminAccess(decoded.uid, 'FORCE_LOGOUT', {
      targetUserId: userId,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    console.log(`✅ Force logout successful for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'User has been logged out from all devices' 
    });
  } catch (error: any) {
    console.error('❌ Error force logging out user:', error);
    return NextResponse.json(
      { error: 'Failed to force logout user', details: error.message },
      { status: 500 }
    );
  }
}


