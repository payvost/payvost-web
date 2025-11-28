import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`Fetching customer ${id} using Firebase Admin SDK...`);
    
    // Fetch user document from Firestore
    const userDoc = await db.collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    const data = userDoc.data()!;
    
    // Fetch transactions for this user (if they exist in a subcollection)
    let transactions: any[] = [];
    try {
      const transactionsSnapshot = await db
        .collection('users')
        .doc(id)
        .collection('transactions')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.log('No transactions subcollection found');
    }
    
    // Extract KYC information from kycProfile
    let kycLevel: 'Basic' | 'Full' | 'Advanced' | undefined = data.kycLevel || undefined;
    let kycIdType: string | undefined = undefined;
    let kycIdNumber: string | undefined = undefined;
    let userType: string = data.userType || 'Normal User';
    
    // Try to get ID info from kycProfile
    if (data.kycProfile) {
      const profile = data.kycProfile;
      
      // Determine KYC level and userType from approved tiers
      if (profile.tiers) {
        if (profile.tiers.tier3?.status === 'approved') {
          kycLevel = 'Advanced';
          // Ensure userType matches the approved tier
          if (!userType || userType === 'Tier 1' || userType === 'Tier 2') {
            userType = 'Tier 3';
          }
        } else if (profile.tiers.tier2?.status === 'approved') {
          kycLevel = kycLevel || 'Full';
          // Ensure userType matches the approved tier
          if (!userType || userType === 'Tier 1') {
            userType = 'Tier 2';
          }
        } else if (profile.tiers.tier1?.status === 'approved') {
          kycLevel = kycLevel || 'Basic';
          // Ensure userType matches the approved tier
          if (!userType || userType === 'Pending') {
            userType = 'Tier 1';
          }
        }
      }
      
      // Also check kycTier field as fallback
      if (data.kycTier === 'tier3' && (!userType || userType === 'Tier 1' || userType === 'Tier 2')) {
        userType = 'Tier 3';
      } else if (data.kycTier === 'tier2' && (!userType || userType === 'Tier 1')) {
        userType = 'Tier 2';
      } else if (data.kycTier === 'tier1' && (!userType || userType === 'Pending')) {
        userType = 'Tier 1';
      }
      
      // Extract ID type and number from tier submissions
      // Check tier2 first (most complete), then tier1
      const tier2 = profile.tiers?.tier2;
      const tier1 = profile.tiers?.tier1;
      
      // Common ID type field names
      const idTypeFields = [
        'idType', 'governmentIdType', 'documentType', 'idDocumentType',
        'identificationType', 'idCardType', 'passportType'
      ];
      
      // Common ID number field names
      const idNumberFields = [
        'idNumber', 'governmentIdNumber', 'documentNumber', 'idDocumentNumber',
        'identificationNumber', 'idCardNumber', 'passportNumber', 'nin',
        'nationalIdNumber', 'nationalIdentificationNumber', 'ssn', 'ssnLast4',
        'kenyaNationalId', 'southAfricaIdNumber', 'ghanaCardNumber'
      ];
      
      // Helper function to extract ID info from additionalFields
      const extractIdInfo = (additionalFields: Record<string, any>) => {
        if (!additionalFields) return { type: null, number: null };
        
        let foundType: string | null = null;
        let foundNumber: string | null = null;
        
        // Look for ID type
        for (const field of idTypeFields) {
          if (additionalFields[field]) {
            foundType = String(additionalFields[field]);
            break;
          }
        }
        
        // Look for ID number
        for (const field of idNumberFields) {
          if (additionalFields[field]) {
            foundNumber = String(additionalFields[field]);
            break;
          }
        }
        
        return { type: foundType, number: foundNumber };
      };
      
      // Try tier2 first
      if (tier2?.additionalFields) {
        const tier2Info = extractIdInfo(tier2.additionalFields);
        if (tier2Info.type) kycIdType = tier2Info.type;
        if (tier2Info.number) kycIdNumber = tier2Info.number;
      }
      
      // Fallback to tier1 if tier2 doesn't have complete info
      if ((!kycIdType || !kycIdNumber) && tier1?.additionalFields) {
        const tier1Info = extractIdInfo(tier1.additionalFields);
        if (!kycIdType && tier1Info.type) kycIdType = tier1Info.type;
        if (!kycIdNumber && tier1Info.number) kycIdNumber = tier1Info.number;
      }
      
      // Also check if there's a direct ID type/number in the profile
      if (!kycIdType && profile.idType) {
        kycIdType = String(profile.idType);
      }
      if (!kycIdNumber && profile.idNumber) {
        kycIdNumber = String(profile.idNumber);
      }
    }
    
    // Also check directly on the user document (data) for idType and idNumber
    if (!kycIdType && data.idType) {
      kycIdType = String(data.idType);
    }
    if (!kycIdNumber && data.idNumber) {
      kycIdNumber = String(data.idNumber);
    }
    
    // Extract SSN and other additional fields from tier1 additionalFields
    let ssn: string | null = null;
    let ssnLast4: string | null = null;
    if (data.kycProfile?.tiers?.tier1?.additionalFields) {
      const additionalFields = data.kycProfile.tiers.tier1.additionalFields;
      ssn = additionalFields.ssn || additionalFields.socialSecurityNumber || null;
      ssnLast4 = additionalFields.ssnLast4 || null;
    }
    
    // Build customer response
    const customer = {
      id: userDoc.id,
      name: data.fullName || data.displayName || data.name || data.email || 'Unknown',
      email: data.email || '',
      phone: data.phoneNumber || data.phone || '',
      photoURL: data.photoURL || null,
      kycStatus: typeof data.kycStatus === 'string' ? data.kycStatus.toLowerCase() : 'unverified',
      kycTier: data.kycTier || null,
      kycProfile: data.kycProfile || null,
      kycLevel: kycLevel || null,
      kycIdType: kycIdType || null,
      kycIdNumber: kycIdNumber || null,
      bvn: data.bvn || null,
      ssn: ssn || null,
      ssnLast4: ssnLast4 || null,
      userType: userType,
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'US',
      riskScore: data.riskScore || 0,
      totalSpend: data.totalSpend || 0,
      associatedAccounts: data.associatedAccounts || [],
      wallets: data.wallets || [],
      transactions: transactions,
      joinedDate: data.createdAt || data.joinedDate || null,
      transactionPin: data.transactionPin || null,
      pinSetupNotified: data.pinSetupNotified || false,
      // Security & login fields
      lastLoginAt: data.lastLoginAt || null,
      lastLoginIp: data.lastLoginIp || null,
      lastLoginDevice: data.lastLoginDevice || null,
      loginHistory: data.loginHistory || null,
      mfaEnabled: data.mfaEnabled || false,
      accountLocked: data.accountLocked || false,
      amlFlags: data.amlFlags || null,
      identityVerificationLogs: data.identityVerificationLogs || null,
      // Address details
      address: data.location ? {
        street: data.location.addressLine1 || data.street,
        city: data.location.city || data.city,
        state: data.location.state || data.state,
        postalCode: data.location.postalCode || data.zip,
        country: data.location.countryName || data.countryName,
      } : (data.street || data.city ? {
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.zip,
        country: data.countryName,
      } : undefined),
      // Additional fields
      dateOfBirth: data.dateOfBirth || null,
      street: data.street || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      // Business info
      businessInfo: data.businessInfo || null,
      // Payment methods
      paymentMethods: data.paymentMethods || null,
      activeServices: data.activeServices || null,
      settlements: data.settlements || null,
      topCounterparties: data.topCounterparties || null,
      transactionCounts: data.transactionCounts || null,
      // Metadata
      metadata: data.metadata || null,
    };

    console.log(`✅ Successfully fetched customer ${id}`);
    return NextResponse.json(customer, { status: 200 });
  } catch (error) {
    console.error('Error fetching customer:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch customer',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
