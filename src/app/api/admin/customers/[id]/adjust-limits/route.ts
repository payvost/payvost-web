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
    const { daily, fx, withdrawal } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (typeof daily !== 'number' || daily < 0) {
      return NextResponse.json({ 
        error: 'Daily limit must be a positive number' 
      }, { status: 400 });
    }

    if (typeof fx !== 'number' || fx < 0) {
      return NextResponse.json({ 
        error: 'FX limit must be a positive number' 
      }, { status: 400 });
    }

    if (typeof withdrawal !== 'number' || withdrawal < 0) {
      return NextResponse.json({ 
        error: 'Withdrawal limit must be a positive number' 
      }, { status: 400 });
    }

    // Get user document to check current limits
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const previousLimits = userData.accountLimits || {
      daily: userData.dailyLimit || 0,
      fx: userData.fxLimit || 0,
      withdrawal: userData.withdrawalLimit || 0,
    };

    console.log(`💰 Adjusting limits for user ${userId}`);

    // Update limits
    const updateData: any = {
      accountLimits: {
        daily,
        fx,
        withdrawal,
      },
      updatedAt: new Date(),
    };

    // Also update individual fields for backward compatibility
    updateData.dailyLimit = daily;
    updateData.fxLimit = fx;
    updateData.withdrawalLimit = withdrawal;

    await userRef.update(updateData);

    // Log the action
    await logAdminAccess(decoded.uid, 'ADJUST_LIMITS', {
      targetUserId: userId,
      previousLimits,
      newLimits: { daily, fx, withdrawal },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    console.log(`✅ Limits adjusted successfully for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Account limits updated successfully',
      limits: { daily, fx, withdrawal },
    });
  } catch (error: any) {
    console.error('❌ Error adjusting limits:', error);
    return NextResponse.json(
      { error: 'Failed to adjust limits', details: error.message },
      { status: 500 }
    );
  }
}

