/**
 * Vercel API Route - Proxies batch email requests to Render/Railway email service
 * This offloads heavy email processing from Vercel to prevent timeouts
 */

import { NextRequest, NextResponse } from 'next/server';

interface BatchEmailRequest {
  emails: Array<{
    to: string;
    subject: string;
    html: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: BatchEmailRequest = await request.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Invalid emails array' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (emails.length > 100) {
      return NextResponse.json(
        { error: 'Batch size limited to 100 emails' },
        { status: 400 }
      );
    }

    // Proxy to email service (Render/Railway)
    const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 
                           process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || 
                           'http://localhost:3006';

    console.log(`[Email API] Proxying batch email request to: ${emailServiceUrl}/batch`);

    const response = await fetch(`${emailServiceUrl}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emails }),
      // Add timeout to prevent hanging - accounts for Render cold start + batch processing
      signal: AbortSignal.timeout(180000), // 3 minutes timeout - accounts for Render cold start (>50s) + batch email processing
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Email API] Email service returned ${response.status}: ${errorText}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email service unavailable',
          details: response.status === 504 ? 'Service timeout' : errorText
        },
        { status: response.status === 504 ? 504 : 503 }
      );
    }

    const data = await response.json();
    console.log(`[Email API] Batch email completed: ${data.successful}/${data.total} successful`);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Email API] Error proxying to email service:', error);
    
    // Check if it's a timeout error
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email service timeout',
          message: 'Email service took too long to respond. Please try again.',
          details: 'Service may be cold-starting (free tier)'
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send batch emails' 
      },
      { status: 500 }
    );
  }
}
