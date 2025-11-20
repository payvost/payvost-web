import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifySessionCookie, isAdmin, logAdminAccess } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifySessionCookie(sessionCookie);
    const hasAdminAccess = await isAdmin(decoded.uid);
    
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { decision, reason } = body;

    if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
      return NextResponse.json(
        { error: 'decision must be either "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Get user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    
    // Verify this is a tier1 user
    if (userData.kycTier !== 'tier1' && userData.kycStatus !== 'tier1_pending_review') {
      return NextResponse.json(
        { error: 'User is not a tier1 pending user' },
        { status: 400 }
      );
    }

    const now = new Date();
    const updateData: any = {
      updatedAt: now,
    };

    if (decision === 'approved') {
      // Update userType from 'Pending' to 'Tier 1'
      updateData.userType = 'Tier 1';
      
      // Update kycStatus - use 'verified' to match existing KYC decision endpoint and firestore rules
      updateData.kycStatus = 'verified';
      
      // Update kycProfile
      if (userData.kycProfile) {
        updateData.kycProfile = {
          ...userData.kycProfile,
          status: 'approved',
          approvedAt: now,
          approvedBy: decoded.uid,
          tiers: {
            ...userData.kycProfile.tiers,
            tier1: {
              ...userData.kycProfile.tiers?.tier1,
              status: 'approved',
              approvedAt: now,
            },
          },
        };
      }
    } else {
      // Rejected
      updateData.userType = 'Pending'; // Keep as Pending
      updateData.kycStatus = 'tier1_rejected';
      
      // Update kycProfile
      if (userData.kycProfile) {
        updateData.kycProfile = {
          ...userData.kycProfile,
          status: 'rejected',
          rejectedAt: now,
          rejectedBy: decoded.uid,
          rejectionReason: reason || 'No reason provided',
          tiers: {
            ...userData.kycProfile.tiers,
            tier1: {
              ...userData.kycProfile.tiers?.tier1,
              status: 'rejected',
              rejectedAt: now,
              rejectionReason: reason || 'No reason provided',
            },
          },
        };
      }
    }

    // Update user document
    await userRef.update(updateData);

    // Log admin action for audit trail
    await logAdminAccess(decoded.uid, 'TIER1_DECISION', {
      userId,
      decision,
      reason: reason || null,
      previousUserType: userData.userType,
      previousKycStatus: userData.kycStatus,
    });

    return NextResponse.json({ 
      success: true,
      userId,
      decision,
      updatedFields: updateData,
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing tier1 decision:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to process tier1 decision',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

