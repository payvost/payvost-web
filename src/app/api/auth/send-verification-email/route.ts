import { NextRequest, NextResponse } from 'next/server';
import { sendCustomVerificationEmail } from '@/lib/custom-email-verification';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, appName } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify the user exists
    try {
      await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Send custom verification email
    const result = await sendCustomVerificationEmail({
      email,
      displayName: displayName || 'User',
      appName: appName || 'Payvost',
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to send verification email' 
      },
      { status: 500 }
    );
  }
}

