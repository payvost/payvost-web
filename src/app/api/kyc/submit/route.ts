import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { processKYCVerification } from '@/lib/kyc/verification-workflow';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/auth-helpers';

/**
 * KYC Submission API with Automated Verification
 * 
 * Expected payload:
 * {
 *   userId: string,
 *   submissionId: string,
 *   tier: 'tier1' | 'tier2' | 'tier3',
 *   country: string,
 *   email?: string,
 *   phone?: string,
 *   fullName?: string,
 *   dateOfBirth?: string,
 *   residentialAddress?: string,
 *   taxID?: string,
 *   sourceOfFunds?: string,
 *   documentUrls: {
 *     idDocument?: string,
 *     proofOfAddress?: string,
 *     selfie?: string,
 *   },
 *   metadata?: Record<string, unknown>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifySessionCookie(sessionCookie);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      submissionId,
      tier,
      country,
      email,
      phone,
      fullName,
      dateOfBirth,
      residentialAddress,
      taxID,
      sourceOfFunds,
      documentUrls = {},
      metadata = {},
    } = body;

    // Validate required fields
    if (!userId || !submissionId || !tier || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, submissionId, tier, country' },
        { status: 400 }
      );
    }

    // Validate tier
    if (!['tier1', 'tier2', 'tier3'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be tier1, tier2, or tier3' },
        { status: 400 }
      );
    }

    // Ensure user can only submit for themselves
    if (userId !== decoded.uid) {
      return NextResponse.json(
        { error: 'You can only submit KYC for your own account' },
        { status: 403 }
      );
    }

    // Get existing submission
    const submissionRef = db.collection('kyc_submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return NextResponse.json(
        { error: 'KYC submission not found' },
        { status: 404 }
      );
    }

    const submissionData = submissionDoc.data();
    if (submissionData?.userId !== userId) {
      return NextResponse.json(
        { error: 'Submission does not belong to this user' },
        { status: 403 }
      );
    }

    // Download files from URLs if needed (for server-side verification)
    // Note: In production, you might want to download files to temporary storage
    // For now, we'll use the document URLs directly in metadata
    
    // Note: File objects can't be passed through JSON, so we work with URLs
    // The verification providers will need to download files from URLs
    // For MVP, we'll mark documents as available via URLs

    // Prepare verification input
    const verificationInput = {
      userId,
      submissionId,
      tier,
      country,
      email: email || submissionData?.email,
      phone: phone || submissionData?.phone,
      fullName: fullName || submissionData?.fullName,
      dateOfBirth: dateOfBirth || submissionData?.dateOfBirth,
      residentialAddress: residentialAddress || submissionData?.residentialAddress,
      taxID: taxID || submissionData?.taxID,
      sourceOfFunds: sourceOfFunds || submissionData?.sourceOfFunds,
      // For File-based verification, we'd need to download from URLs
      // For now, we'll pass URLs in metadata for providers that support it
      metadata: {
        ...metadata,
        documentUrls,
        // Pass user data from submission
        ...(submissionData?.additionalFields || {}),
      },
    };

    // Process verification asynchronously
    // Note: In production, you might want to use a queue/job system
    let verificationResult;
    try {
      verificationResult = await processKYCVerification(verificationInput);
    } catch (error) {
      console.error('Verification processing error:', error);
      
      // Update submission with error status
      await submissionRef.update({
        status: 'in_review',
        verificationError: error instanceof Error ? error.message : 'Verification processing failed',
        updatedAt: new Date(),
      });

      return NextResponse.json(
        {
          status: 'error',
          submissionId,
          message: 'Verification processing failed. Submission set to manual review.',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Save verification result to Firestore
    const verificationRef = db
      .collection('kyc_verifications')
      .doc(`${submissionId}_${tier}`);
    
    await verificationRef.set({
      ...verificationResult,
      createdAt: new Date(verificationResult.createdAt),
      updatedAt: new Date(verificationResult.updatedAt),
    });

    // Update submission status
    const submissionUpdate: any = {
      status: verificationResult.status === 'approved' ? 'approved' : 
              verificationResult.status === 'rejected' ? 'rejected' : 'in_review',
      verificationResultId: verificationRef.id,
      autoApproved: verificationResult.autoApproved,
      confidenceScore: verificationResult.confidenceScore,
      updatedAt: new Date(),
    };

    if (verificationResult.rejectionReason) {
      submissionUpdate.rejectionReason = verificationResult.rejectionReason;
      submissionUpdate.decidedAt = new Date();
    }

    if (verificationResult.autoApproved) {
      submissionUpdate.decidedAt = new Date();
      submissionUpdate.decidedBy = 'system';
    }

    await submissionRef.update(submissionUpdate);

    // If auto-approved, update user's KYC status
    if (verificationResult.status === 'approved' && verificationResult.autoApproved) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const userUpdate: any = {
          kycTier: tier,
          kycStatus: tier === 'tier1' ? 'tier1_verified' : 'verified',
          updatedAt: new Date(),
        };

        // Update KYC level
        if (tier === 'tier2') {
          userUpdate.kycLevel = 'Full';
          userUpdate.userType = 'Tier 2';
        } else if (tier === 'tier3') {
          userUpdate.kycLevel = 'Advanced';
          userUpdate.userType = 'Tier 3';
        }

        // Update kycProfile
        if (userData?.kycProfile) {
          const kycProfile = { ...userData.kycProfile };
          
          if (tier === 'tier2' && kycProfile.tiers?.tier2) {
            kycProfile.tiers.tier2 = {
              ...kycProfile.tiers.tier2,
              status: 'approved',
              approvedAt: new Date(),
              approvedBy: 'system',
            };
            kycProfile.currentTier = 'tier2';
          } else if (tier === 'tier3' && kycProfile.tiers?.tier3) {
            kycProfile.tiers.tier3 = {
              ...kycProfile.tiers.tier3,
              status: 'approved',
              approvedAt: new Date(),
              approvedBy: 'system',
            };
            kycProfile.currentTier = 'tier3';
          }
          
          kycProfile.status = 'approved';
          userUpdate.kycProfile = kycProfile;
        }

        await userRef.update(userUpdate);
      }
    }

    // Return response
    return NextResponse.json(
      {
        status: 'accepted',
        submissionId,
        verificationStatus: verificationResult.status,
        autoApproved: verificationResult.autoApproved,
        confidenceScore: verificationResult.confidenceScore,
        requiresManualReview: verificationResult.requiresManualReview,
        message: verificationResult.autoApproved
          ? 'KYC verification completed and approved automatically'
          : 'KYC verification submitted for review',
      },
      { status: verificationResult.autoApproved ? 200 : 202 }
    );
  } catch (error) {
    console.error('KYC submission error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process KYC submission',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
