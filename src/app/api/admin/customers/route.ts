import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching customers using Firebase Admin SDK...');
    
    // Fetch all users from Firestore using Admin SDK
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`✅ Successfully fetched ${usersSnapshot.size} users from Firestore (Admin SDK)`);
    
    const customers = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.fullName || data.displayName || data.name || data.email || 'Unknown',
        email: data.email || '',
        phone: data.phoneNumber || data.phone || '',
  kycStatus: typeof data.kycStatus === 'string' ? data.kycStatus.toLowerCase() : 'unverified',
        userType: data.userType || 'Normal User',
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'US',
        riskScore: data.riskScore || 0,
        totalSpend: data.totalSpend || 0,
        associatedAccounts: data.associatedAccounts || [],
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      };
    });

    return NextResponse.json(customers, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch customers',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
