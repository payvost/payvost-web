import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase-admin';
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
    const { level } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!level || !['Basic', 'Full', 'Advanced'].includes(level)) {
      return NextResponse.json({ 
        error: 'Valid KYC level required (Basic, Full, or Advanced)' 
      }, { status: 400 });
    }

    // Get user document to check current state
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const previousLevel = userData.kycLevel || 'N/A';

    console.log(`📝 Changing KYC level for user ${userId} from ${previousLevel} to ${level}`);

    // Update KYC level
    const updateData: any = {
      kycLevel: level,
      updatedAt: new Date(),
    };

    // Optionally update userType based on KYC level if needed
    // This is a simple mapping - adjust based on your business logic
    if (level === 'Advanced' && userData.userType !== 'Tier 3') {
      updateData.userType = 'Tier 3';
    } else if (level === 'Full' && userData.userType === 'Tier 1') {
      updateData.userType = 'Tier 2';
    } else if (level === 'Basic' && !userData.userType) {
      updateData.userType = 'Tier 1';
    }

    await userRef.update(updateData);

    // Log the action
    await logAdminAccess(decoded.uid, 'CHANGE_KYC_LEVEL', {
      targetUserId: userId,
      previousLevel,
      newLevel: level,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    console.log(`✅ KYC level changed successfully for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: `KYC level updated to ${level}`,
      previousLevel,
      newLevel: level,
    });
  } catch (error: any) {
    console.error('❌ Error changing KYC level:', error);
    return NextResponse.json(
      { error: 'Failed to change KYC level', details: error.message },
      { status: 500 }
    );
  }
}


