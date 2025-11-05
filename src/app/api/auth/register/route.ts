import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, admin } from '@/lib/firebase-admin';

const FieldValue = admin.firestore.FieldValue;

export async function POST(request: Request) {
  try {
    const { email, password, displayName, phoneNumber, countryCode, userType } = await request.json();

    // Validate required fields
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, displayName' },
        { status: 400 }
      );
    }

    // Create user with Firebase Admin SDK (bypasses client restrictions)
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      phoneNumber: phoneNumber || undefined,
      emailVerified: false,
    });

    // Create user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      phoneNumber: phoneNumber || '',
      country: '',
      countryCode: countryCode || '',
      userType: userType || 'Pending',
  kycStatus: 'unverified',
      kycLevel: null,
      riskScore: 0,
      totalSpend: 0,
      wallets: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Generate custom token for immediate sign-in
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      customToken,
    });
  } catch (error: any) {
    console.error('User creation error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak. Must be at least 6 characters.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user account' },
      { status: 500 }
    );
  }
}
