import { db } from '@/lib/firebase-admin';

/**
 * Firebase Multi-Factor Authentication Service
 * 
 * This service manages 2FA status in Firestore for display purposes.
 * The actual MFA enrollment and verification is handled by Firebase Authentication
 * on the client side using multiFactor() API.
 * 
 * Firebase automatically sends email notifications when:
 * - User enrolls in MFA
 * - User signs in with MFA
 * - MFA is removed from account
 */

export interface TwoFactorStatus {
  enabled: boolean;
  methods: Array<{
    type: 'phone' | 'totp';
    displayName: string;
    enrolledAt: Date;
  }>;
}

/**
 * Get user's MFA status from Firebase Auth
 * This queries Firebase Auth Admin SDK to get enrolled factors
 */
export async function get2FAStatus(userId: string): Promise<{
  enabled: boolean;
  method: string | null;
  verified: boolean;
  hasBackupCodes: boolean;
}> {
  try {
    const { auth } = await import('@/lib/firebase-admin');
    const user = await auth.getUser(userId);
    
    const enrolledFactors = user.multiFactor?.enrolledFactors || [];
    const hasMFA = enrolledFactors.length > 0;
    
    // Determine primary method
    let method: string | null = null;
    if (enrolledFactors.length > 0) {
      const firstFactor = enrolledFactors[0];
      if (firstFactor.factorId === 'phone') {
        method = 'sms';
      } else if (firstFactor.factorId === 'totp') {
        method = 'authenticator';
      }
    }

    // Store status in Firestore for quick access
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      twoFactorEnabled: hasMFA,
      twoFactorMethod: method,
      twoFactorVerified: hasMFA,
    }, { merge: true });

    return {
      enabled: hasMFA,
      method,
      verified: hasMFA,
      hasBackupCodes: false, // Firebase doesn't use backup codes
    };
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    return {
      enabled: false,
      method: null,
      verified: false,
      hasBackupCodes: false,
    };
  }
}

/**
 * Update Firestore when user completes MFA enrollment on client
 * This is called after successful client-side enrollment
 */
export async function recordMFAEnrollment(
  userId: string,
  method: 'phone' | 'totp',
  displayName: string
): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  await userRef.set({
    twoFactorEnabled: true,
    twoFactorMethod: method === 'phone' ? 'sms' : 'authenticator',
    twoFactorVerified: true,
    twoFactorEnrolledAt: new Date(),
    twoFactorDisplayName: displayName,
  }, { merge: true });
}

/**
 * Clear MFA status in Firestore when user unenrolls
 */
export async function recordMFAUnenrollment(userId: string): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  await userRef.set({
    twoFactorEnabled: false,
    twoFactorMethod: null,
    twoFactorVerified: false,
    twoFactorEnrolledAt: null,
    twoFactorDisplayName: null,
  }, { merge: true });
}
