/**
 * Vercel API Route - Proxies webhook requests to Render/Railway webhook service
 * This offloads long-running webhook processing from Vercel to prevent timeouts
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/webhooks/reloadly
 * 
 * Proxy webhook requests to webhook service
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Webhook API] Proxying Reloadly webhook request...');

    // Proxy to webhook service (Render/Railway)
    const webhookServiceUrl = process.env.WEBHOOK_SERVICE_URL || 
                              process.env.NEXT_PUBLIC_WEBHOOK_SERVICE_URL || 
                              'http://localhost:3008';

    // Get request body as text (needed for signature verification on service side)
    const bodyText = await request.text();
    
    // Forward signature headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const signature = request.headers.get('x-reloadly-signature') || 
                     request.headers.get('x-webhook-signature');
    if (signature) {
      headers['x-reloadly-signature'] = signature;
    }

    console.log(`[Webhook API] Calling webhook service: ${webhookServiceUrl}/reloadly`);

    const response = await fetch(`${webhookServiceUrl}/reloadly`, {
      method: 'POST',
      headers,
      body: bodyText,
      // Add timeout - accounts for Render cold start (>50s) + processing time
      signal: AbortSignal.timeout(90000), // 90 seconds timeout - accounts for Render cold start
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Webhook API] Webhook service returned ${response.status}: ${errorText}`);
      return NextResponse.json(
        { 
          error: 'Webhook service unavailable',
          details: response.status === 504 ? 'Service timeout' : errorText
        },
        { status: response.status === 504 ? 504 : 503 }
      );
    }

    const data = await response.json();
    console.log('[Webhook API] Webhook processed successfully');

    return NextResponse.json(data, { status: 200 });
    
  } catch (error: any) {
    console.error('[Webhook API] Error proxying to webhook service:', error);
    
    // Check if it's a timeout error
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          error: 'Webhook service timeout',
          message: 'Webhook service took too long to respond.',
          details: 'Service may be processing complex operations'
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/reloadly
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Reloadly webhook endpoint is active (proxied to webhook service)',
    timestamp: new Date().toISOString(),
  });
}
