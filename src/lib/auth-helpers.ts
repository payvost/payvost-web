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
 * Automatically fetches and includes user details (name, role) for better audit trail
 */
export async function logAdminAccess(
  uid: string,
  action: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // Fetch user details to enrich the audit log
    let userName: string | undefined;
    let userType: string | undefined;
    
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userName = userData?.fullName || userData?.displayName || userData?.name || userData?.email || undefined;
        const role = userData?.role || userData?.userType;
        userType = role === 'admin' || role === 'super_admin' ? 'Admin' : 'Customer';
      }
    } catch (userError) {
      // If we can't fetch user details, continue without them
      console.warn('Could not fetch user details for audit log:', userError);
    }

    await db.collection('adminAuditLog').add({
      uid,
      action,
      userName,
      userType,
      metadata: {
        ...(metadata || {}),
        userName,
        userType,
      },
      timestamp: new Date(),
      ip: metadata?.ip || 'unknown',
    });
  } catch (error) {
    console.error('Failed to log admin access:', error);
    // Don't throw - logging failure shouldn't block access
  }
}

/**
 * Check if a user has writer role in Firestore
 */
export async function isWriter(uid: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    const role = userData?.role?.toLowerCase();
    
    // Writers can be: writer, editor, content_manager, or admin
    return ['writer', 'editor', 'content_manager', 'admin', 'super_admin'].includes(role);
  } catch (error) {
    console.error('Error checking writer role:', error);
    return false;
  }
}

/**
 * Verify if user has writer role, throws error if not
 */
export async function requireWriter(uid: string): Promise<void> {
  const hasWriterRole = await isWriter(uid);
  
  if (!hasWriterRole) {
    throw new Error('Unauthorized: Writer access required');
  }
}

/**
 * Check if a user has HR admin role in Firestore
 */
export async function isHrAdmin(uid: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    const role = userData?.role?.toLowerCase();
    
    return role === 'hr_admin' || role === 'admin' || role === 'super_admin';
  } catch (error) {
    console.error('Error checking HR admin role:', error);
    return false;
  }
}

/**
 * Verify if user has HR admin role, throws error if not
 */
export async function requireHrAdmin(uid: string): Promise<void> {
  const hasHrAdminRole = await isHrAdmin(uid);
  
  if (!hasHrAdminRole) {
    throw new Error('Unauthorized: HR Admin access required');
  }
}

/**
 * Check if a user has support team role in Firestore
 */
export async function isSupportTeam(uid: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    const role = userData?.role?.toLowerCase();
    
    // Support roles: support_agent, support_senior, support_supervisor, support_manager
    // Also allow admin and super_admin
    return role?.startsWith('support_') || role === 'admin' || role === 'super_admin';
  } catch (error) {
    console.error('Error checking support team role:', error);
    return false;
  }
}

/**
 * Verify if user has support team role, throws error if not
 */
export async function requireSupportTeam(uid: string): Promise<void> {
  const hasSupportRole = await isSupportTeam(uid);
  
  if (!hasSupportRole) {
    throw new Error('Unauthorized: Support team access required');
  }
}