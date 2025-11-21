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
    const { submissionId, decision, reason, adminResponse } = body;

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

    if (decision === 'rejected' && !reason) {
      return NextResponse.json(
        { error: 'reason is required for rejection' },
        { status: 400 }
      );
    }

    // Get submission
    const submissionRef = db.collection('business_onboarding').doc(submissionId);
    const submissionDoc = await submissionRef.get();
    
    if (!submissionDoc.exists) {
      return NextResponse.json(
        { error: 'Business onboarding submission not found' },
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

    if (adminResponse) {
      updateData.adminResponse = adminResponse;
    }

    // Update submission
    await submissionRef.update(updateData);

    // Update user's KYC status and business profile
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data()!;
      
      const userUpdate: any = {
        updatedAt: new Date(),
      };

      // If approved, update user to Tier 3 and business profile
      if (decision === 'approved') {
        userUpdate.kycTier = 'tier3';
        userUpdate.kycLevel = 'tier3';
        userUpdate.userType = 'Tier 3';
        userUpdate.kycStatus = 'verified';
        
        // Update business profile
        userUpdate.businessProfile = {
          name: submissionData.name,
          type: submissionData.type,
          industry: submissionData.industry,
          registrationNumber: submissionData.registrationNumber,
          taxId: submissionData.taxId,
          address: submissionData.address,
          email: submissionData.email,
          website: submissionData.website || null,
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: decoded.uid,
        };

        // Update kycProfile to mark tier3 as approved
        if (userData.kycProfile) {
          const kycProfile = { ...userData.kycProfile };
          
          if (kycProfile.tiers?.tier3) {
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
        // If rejected, update kycProfile to mark tier3 as rejected
        if (userData.kycProfile) {
          const kycProfile = { ...userData.kycProfile };
          
          if (kycProfile.tiers?.tier3) {
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
      }

      await userRef.update(userUpdate);
    }

    // Log admin action for audit trail
    await logAdminAccess(decoded.uid, 'BUSINESS_ONBOARDING_DECISION', {
      submissionId,
      userId,
      decision,
      reason: reason || null,
      adminResponse: adminResponse || null,
      previousStatus: submissionData.status,
    });

    // Send notification to user about the decision
    try {
      if (decision === 'approved') {
        await sendUnifiedNotification({
          userId,
          title: 'Business Onboarding Approved ✓',
          body: `Congratulations! Your business onboarding for ${submissionData.name} has been approved. You now have Tier 3 access with unlimited transactions and business account features.${adminResponse ? ` ${adminResponse}` : ''}`,
          type: 'kyc',
          data: {
            status: 'approved',
            submissionId,
            businessName: submissionData.name,
          },
          clickAction: '/dashboard/profile',
        });
      } else {
        await sendUnifiedNotification({
          userId,
          title: 'Business Onboarding Review Complete',
          body: `Your business onboarding submission has been reviewed.${reason ? ` Reason: ${reason}` : ''}${adminResponse ? ` ${adminResponse}` : ''} Please review the details and take necessary actions.`,
          type: 'kyc',
          data: {
            status: 'rejected',
            submissionId,
            reason: reason || 'No reason provided',
            businessName: submissionData.name,
          },
          clickAction: '/dashboard/get-started/onboarding/business',
        });
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ 
      success: true,
      submissionId,
      decision,
      userId,
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing business onboarding decision:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to process business onboarding decision',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

