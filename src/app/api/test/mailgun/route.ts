import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

/**
 * Test endpoint to verify Mailgun is configured and working
 * Sends a test email to the user's email address
 */
export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const { token } = await requireAuth(req);

    // Get user email from query params
    const { searchParams } = new URL(req.url);
    const testEmail = searchParams.get('email');

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Email parameter required. Usage: POST /api/test/mailgun?email=test@example.com' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Call backend test endpoint
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/test/mailgun?email=${encodeURIComponent(testEmail)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[mailgun test] Backend error:', errorData);
      return NextResponse.json(
        { error: 'Backend test failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      ...data,
    });
  } catch (error: any) {
    console.error('[mailgun test] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
