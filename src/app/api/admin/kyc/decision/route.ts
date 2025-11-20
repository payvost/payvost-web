import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifySessionCookie, isAdmin, logAdminAccess } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { submissionId, decision, reason, level } = body;

    if (!submissionId || !decision) {
      return NextResponse.json(
        { error: 'submissionId and decision are required' },
        { status: 400 }
      );
    }

    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json(
        { error: 'decision must be either "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Get submission
    const submissionRef = db.collection('kyc_submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();
    
    if (!submissionDoc.exists) {
      return NextResponse.json(
        { error: 'KYC submission not found' },
        { status: 404 }
      );
    }

    const submissionData = submissionDoc.data()!;
    const userId = submissionData.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid submission: missing userId' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: decision === 'approved' ? 'approved' : 'rejected',
      decidedAt: new Date(),
      decidedBy: decoded.uid,
      updatedAt: new Date(),
    };

    if (reason) {
      updateData.rejectionReason = reason;
    }

    // Update submission
    await submissionRef.update(updateData);

    // Update user's KYC status
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data()!;
      const submissionLevel = submissionData.level || level; // tier2, tier3, etc.
      
      const userUpdate: any = {
        kycStatus: decision === 'approved' ? 'verified' : 'rejected',
        updatedAt: new Date(),
      };

      // If approved, update userType, kycTier, and kycLevel based on submission level
      if (decision === 'approved') {
        // Update kycTier based on submission level
        if (submissionLevel === 'tier2') {
          userUpdate.kycTier = 'tier2';
          userUpdate.userType = 'Tier 2';
        } else if (submissionLevel === 'tier3') {
          userUpdate.kycTier = 'tier3';
          userUpdate.userType = 'Tier 3';
        }
        
        // Update KYC level if provided
        if (level) {
          userUpdate.kycLevel = level;
        } else if (submissionLevel === 'tier2') {
          userUpdate.kycLevel = 'Full';
        } else if (submissionLevel === 'tier3') {
          userUpdate.kycLevel = 'Advanced';
        }
        
        // Update kycProfile to mark the tier as approved
        if (userData.kycProfile) {
          const kycProfile = { ...userData.kycProfile };
          
          if (submissionLevel === 'tier2' && kycProfile.tiers?.tier2) {
            kycProfile.tiers.tier2 = {
              ...kycProfile.tiers.tier2,
              status: 'approved',
              approvedAt: new Date(),
              approvedBy: decoded.uid,
            };
            kycProfile.currentTier = 'tier2';
            kycProfile.status = 'approved';
          } else if (submissionLevel === 'tier3' && kycProfile.tiers?.tier3) {
            kycProfile.tiers.tier3 = {
              ...kycProfile.tiers.tier3,
              status: 'approved',
              approvedAt: new Date(),
              approvedBy: decoded.uid,
            };
            kycProfile.currentTier = 'tier3';
            kycProfile.status = 'approved';
          }
          
          userUpdate.kycProfile = kycProfile;
        }
      } else {
        // If rejected, update kycProfile to mark the tier as rejected
        if (userData.kycProfile) {
          const kycProfile = { ...userData.kycProfile };
          
          if (submissionLevel === 'tier2' && kycProfile.tiers?.tier2) {
            kycProfile.tiers.tier2 = {
              ...kycProfile.tiers.tier2,
              status: 'rejected',
              rejectedAt: new Date(),
              rejectedBy: decoded.uid,
              rejectionReason: reason || 'No reason provided',
            };
          } else if (submissionLevel === 'tier3' && kycProfile.tiers?.tier3) {
            kycProfile.tiers.tier3 = {
              ...kycProfile.tiers.tier3,
              status: 'rejected',
              rejectedAt: new Date(),
              rejectedBy: decoded.uid,
              rejectionReason: reason || 'No reason provided',
            };
          }
          
          userUpdate.kycProfile = kycProfile;
        }
        
        // Clear KYC level if rejected
        userUpdate.kycLevel = null;
      }

      await userRef.update(userUpdate);
    }

    // Log admin action for audit trail
    await logAdminAccess(decoded.uid, 'KYC_DECISION', {
      submissionId,
      userId,
      decision,
      reason: reason || null,
      level: level || null,
      previousStatus: submissionData.status,
    });

    // TODO: Send notification to user about the decision
    // This would typically call a notification service or trigger a Cloud Function

    return NextResponse.json({ 
      success: true,
      submissionId,
      decision,
      userId,
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing KYC decision:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to process KYC decision',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
