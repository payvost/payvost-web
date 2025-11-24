import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth, admin } from '@/lib/firebase-admin';

/**
 * POST /api/auth/track-login
 * Tracks user login and updates lastLoginAt, lastLoginIp, and lastLoginDevice
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

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Extract IP address from request headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               request.headers.get('cf-connecting-ip') ||
               'unknown';

    // Extract user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Parse device information from user agent
    const getDeviceInfo = (ua: string): string => {
      if (!ua || ua === 'unknown') return 'Unknown';
      
      // Mobile detection
      if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        if (/iPhone|iPad|iPod/i.test(ua)) {
          return 'iOS Device';
        } else if (/Android/i.test(ua)) {
          return 'Android Device';
        }
        return 'Mobile Device';
      }
      
      // Desktop browser detection
      if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) {
        return 'Chrome';
      } else if (/Firefox/i.test(ua)) {
        return 'Firefox';
      } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
        return 'Safari';
      } else if (/Edge|Edg/i.test(ua)) {
        return 'Edge';
      } else if (/Opera|OPR/i.test(ua)) {
        return 'Opera';
      }
      
      return 'Web Browser';
    };

    const deviceInfo = getDeviceInfo(userAgent);

    // Update user document in Firestore
    const userRef = adminDb.collection('users').doc(uid);
    const now = new Date();

    // Update last login fields
    await userRef.update({
      lastLoginAt: admin.firestore.Timestamp.fromDate(now),
      lastLoginIp: ip,
      lastLoginDevice: deviceInfo,
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    });

    // Also add to login history if it exists
    try {
      const loginHistoryRef = userRef.collection('loginHistory');
      await loginHistoryRef.add({
        timestamp: admin.firestore.Timestamp.fromDate(now),
        ip: ip,
        device: deviceInfo,
        userAgent: userAgent,
      });
    } catch (err) {
      // Login history is optional, continue if it fails
      console.log('Could not update login history:', err);
    }

    console.log(`✅ Login tracked for user: ${uid} from IP: ${ip} on device: ${deviceInfo}`);

    return NextResponse.json({
      success: true,
      message: 'Login tracked successfully',
    });

  } catch (error: any) {
    console.error('❌ Error tracking login:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to track login',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

