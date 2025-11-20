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
      bvn: data.bvn || null,
      userType: data.userType || 'Normal User',
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
