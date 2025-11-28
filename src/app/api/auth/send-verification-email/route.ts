import { NextRequest, NextResponse } from 'next/server';
import { sendCustomVerificationEmail } from '@/lib/custom-email-verification';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // If it's a user-not-found error, don't retry
      if (error.code === 'auth/user-not-found') {
        throw error;
      }
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms for email verification`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

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

    // Verify the user exists with retry logic (for newly registered users)
    // Newly registered users may take a moment to propagate in Firebase Auth
    try {
      await retryWithBackoff(
        async () => {
          const user = await adminAuth.getUserByEmail(email);
          return user;
        },
        3, // max retries
        500 // initial delay 500ms
      );
    } catch (error: any) {
      console.error('Error verifying user exists:', error);
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      // For other errors, log but continue - the email generation might still work
      console.warn('User verification failed, but attempting to send email anyway:', error.message);
    }

    // Send custom verification email with retry logic
    const result = await retryWithBackoff(
      async () => {
        return await sendCustomVerificationEmail({
          email,
          displayName: displayName || 'User',
          appName: appName || 'Payvost',
        });
      },
      3, // max retries
      500 // initial delay 500ms
    );

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('Error sending verification email:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to send verification email',
        code: error.code || 'unknown_error'
      },
      { status: 500 }
    );
  }
}

