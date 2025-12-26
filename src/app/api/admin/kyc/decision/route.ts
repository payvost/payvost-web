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
    const submissionLevel = submissionData.level || level; // tier2, tier3, etc.
    
    if (userDoc.exists) {
      const userData = userDoc.data()!;
      
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

    // Send notification to user about the decision
    if (decision === 'approved') {
      try {
        const tierName = submissionLevel === 'tier2' ? 'Tier 2' : submissionLevel === 'tier3' ? 'Tier 3' : 'Higher Tier';
        const notificationTitle = `${tierName} Verification Approved!`;
        const notificationBody = submissionLevel === 'tier2'
          ? 'Congratulations! Your Tier 2 verification has been approved. You now have enhanced access to additional features and higher transaction limits.'
          : submissionLevel === 'tier3'
          ? 'Congratulations! Your Tier 3 verification has been approved. You now have full access to all features including business account capabilities.'
          : 'Congratulations! Your verification has been approved.';

        // Create in-app notification in user's notifications subcollection
        await db.collection('users').doc(userId).collection('notifications').add({
          userId,
          title: notificationTitle,
          description: notificationBody,
          message: notificationBody,
          type: 'kyc',
          icon: 'success',
          context: 'personal',
          read: false,
          date: new Date(),
          href: '/dashboard/profile',
          link: '/dashboard/profile',
          data: {
            status: 'approved',
            tier: submissionLevel,
            submissionId,
          },
          createdAt: new Date(),
        });
      } catch (error) {
        console.error('Error sending KYC approval notification:', error);
        // Don't fail the request if notification fails
      }
    } else {
      // Send rejection notification
      try {
        const tierName = submissionLevel === 'tier2' ? 'Tier 2' : submissionLevel === 'tier3' ? 'Tier 3' : 'Higher Tier';
        const notificationTitle = `${tierName} Verification Update`;
        const notificationBody = `Your ${tierName.toLowerCase()} verification has been reviewed.${reason ? ` Reason: ${reason}` : ''} Please review the details and take necessary actions.`;

        await db.collection('users').doc(userId).collection('notifications').add({
          userId,
          title: notificationTitle,
          description: notificationBody,
          message: notificationBody,
          type: 'kyc',
          icon: 'alert',
          context: 'personal',
          read: false,
          date: new Date(),
          href: '/dashboard/get-started/onboarding',
          link: '/dashboard/get-started/onboarding',
          data: {
            status: 'rejected',
            tier: submissionLevel,
            submissionId,
            reason: reason || null,
          },
          createdAt: new Date(),
        });
      } catch (error) {
        console.error('Error sending KYC rejection notification:', error);
        // Don't fail the request if notification fails
      }
    }

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
