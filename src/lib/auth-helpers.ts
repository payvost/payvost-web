import { db, auth } from '@/lib/firebase-admin';

/**
 * Check if a user has admin role in Firestore
 */
export async function isAdmin(uid: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    const role = userData?.role?.toLowerCase();
    
    return role === 'admin' || role === 'super_admin';
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}

/**
 * Verify if user has admin role, throws error if not
 */
export async function requireAdmin(uid: string): Promise<void> {
  const hasAdminRole = await isAdmin(uid);
  
  if (!hasAdminRole) {
    throw new Error('Unauthorized: Admin access required');
  }
}

/**
 * Get user role from Firestore
 */
export async function getUserRole(uid: string): Promise<string | null> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    return userDoc.data()?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Verify session cookie and return decoded token
 */
export async function verifySessionCookie(sessionCookie: string) {
  try {
    return await auth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    console.error('Session verification failed:', error);
    throw new Error('Invalid or expired session');
  }
}

/**
 * Log admin access for audit trail
 */
export async function logAdminAccess(
  uid: string,
  action: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await db.collection('adminAuditLog').add({
      uid,
      action,
      metadata: metadata || {},
      timestamp: new Date(),
      ip: metadata?.ip || 'unknown',
    });
  } catch (error) {
    console.error('Failed to log admin access:', error);
    // Don't throw - logging failure shouldn't block access
  }
}
