import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifySessionCookie, isAdmin } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { BusinessAccountData, BusinessVerificationStatus, BusinessKycTier } from '@/types/business-account';

export async function GET(request: NextRequest) {
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

    // Fetch all BUSINESS type accounts from Prisma
    const businessAccounts = await prisma.account.findMany({
      where: {
        type: 'BUSINESS',
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch business onboarding data and user info from Firestore
    const businessAccountsData: BusinessAccountData[] = await Promise.all(
      businessAccounts.map(async (account) => {
        try {
          // Get user info from Firestore
          const userDoc = await db.collection('users').doc(account.userId).get();
          const userData = userDoc.data();

          // Get business onboarding data
          const onboardingQuery = await db
            .collection('business_onboarding')
            .where('userId', '==', account.userId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

          const onboardingData = onboardingQuery.docs[0]?.data();

          // Map KYC status
          const kycStatus = account.user.kycStatus?.toLowerCase() || 'pending';
          let verificationStatus: BusinessVerificationStatus = 'pending';
          if (kycStatus === 'verified') {
            verificationStatus = 'verified';
          } else if (kycStatus === 'rejected') {
            verificationStatus = 'rejected';
          } else if (kycStatus === 'restricted') {
            verificationStatus = 'restricted';
          }

          // Determine KYC tier based on user tier or default to Tier 1
          let kycTier: BusinessKycTier = 'Tier 1';
          const userTier = account.user.userTier || 'STANDARD';
          if (userTier === 'TIER2' || userTier === 'Tier 2') {
            kycTier = 'Tier 2';
          } else if (userTier === 'TIER3' || userTier === 'Tier 3') {
            kycTier = 'Tier 3';
          }

          // Get business name and sector from onboarding data or user data
          const businessName = onboardingData?.name || userData?.businessName || account.user.name || 'Unknown Business';
          const sector = onboardingData?.industry || userData?.sector || 'General';
          const country = account.user.country || onboardingData?.address?.split(',').pop()?.trim() || 'Unknown';
          const countryCode = userData?.countryCode || 'US';
          const contactEmail = onboardingData?.email || account.user.email || '';

          // Calculate payment volume from ledger entries (credits only)
          const ledgerEntries = await prisma.ledgerEntry.findMany({
            where: {
              accountId: account.id,
              amount: { gt: 0 }, // Only credits
            },
          });
          const paymentVolume = ledgerEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

          // Get activity log (simplified - could be enhanced)
          const activityLog = [
            {
              action: 'Account Created',
              date: account.createdAt.toISOString().split('T')[0],
              actor: 'System',
            },
          ];

          // Get documents from onboarding data
          const documents = (onboardingData?.documents || []).map((doc: any) => ({
            name: doc.name || 'Document',
            status: doc.status === 'approved' ? 'Approved' as const : 
                   doc.status === 'rejected' ? 'Rejected' as const : 
                   'Pending' as const,
            url: doc.url || doc.signedUrl || '#',
          }));

          // Calculate dispute ratio (placeholder - would need actual dispute data)
          const disputeRatio = 0;

          return {
            id: account.id,
            businessName,
            sector,
            onboardingDate: account.createdAt.toISOString().split('T')[0],
            country,
            countryCode,
            verificationStatus,
            kycTier,
            contactEmail,
            paymentVolume,
            disputeRatio,
            owner: {
              id: account.userId,
              name: account.user.name || userData?.fullName || userData?.displayName || 'Unknown',
            },
            activityLog,
            documents,
          };
        } catch (error) {
          console.error(`Error processing business account ${account.id}:`, error);
          // Return a minimal entry if there's an error
          return {
            id: account.id,
            businessName: account.user.name || 'Unknown Business',
            sector: 'General',
            onboardingDate: account.createdAt.toISOString().split('T')[0],
            country: account.user.country || 'Unknown',
            countryCode: 'US',
            verificationStatus: 'pending' as BusinessVerificationStatus,
            kycTier: 'Tier 1' as BusinessKycTier,
            contactEmail: account.user.email || '',
            paymentVolume: 0,
            disputeRatio: 0,
            owner: {
              id: account.userId,
              name: account.user.name || 'Unknown',
            },
            activityLog: [],
            documents: [],
          };
        }
      })
    );

    return NextResponse.json(businessAccountsData, { status: 200 });
  } catch (error) {
    console.error('Error fetching business accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch business accounts',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

