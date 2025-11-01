import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, auth } from '@/lib/firebase-admin';
import { verifySessionCookie, isAdmin } from '@/lib/auth-helpers';

export async function GET() {
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

    console.log('🔍 Fetching admin profile for:', decoded.uid);

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.data();

    // Get user from Firebase Auth for email verification status
    const authUser = await auth.getUser(decoded.uid);

    // Get recent activity logs for this admin
    // Note: We fetch all logs and filter client-side to avoid needing a composite index
    const activityLogsSnapshot = await db
      .collection('adminAuditLog')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const activityLog = activityLogsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid,
          action: data.action || 'Unknown action',
          timestamp: data.timestamp?.toDate?.() || new Date(),
          metadata: data.metadata || {},
        };
      })
      .filter((log) => log.uid === decoded.uid)
      .slice(0, 10);

    // Get active sessions from Firebase Auth (simulated for now)
    // Note: Firebase Admin SDK doesn't provide a direct way to list all sessions
    // We'll use the current session info
    const sessionList = [
      {
        id: decoded.uid.substring(0, 8),
        device: 'Current session',
        lastSeen: new Date().toLocaleString(),
        validSince: new Date(decoded.iat * 1000).toLocaleString(),
      },
    ];

    // Determine status based on user state
    let status = 'Active';
    if (authUser.disabled) {
      status = 'Suspended';
    } else if (!authUser.emailVerified) {
      status = 'Invited';
    }

    const profile = {
      id: decoded.uid,
      name: userData?.fullName || userData?.displayName || authUser.displayName || 'Admin User',
      email: authUser.email || userData?.email,
      role: userData?.role === 'super_admin' ? 'Super Admin' : 'Admin',
      status,
      lastActive: authUser.metadata.lastSignInTime || authUser.metadata.creationTime,
      emailVerified: authUser.emailVerified,
      createdAt: authUser.metadata.creationTime,
      photoURL: authUser.photoURL || userData?.photoURL,
      sessions: sessionList,
      activityLog,
    };

    console.log(`✅ Profile loaded for: ${profile.email}`);

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('❌ Error fetching admin profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    );
  }
}
