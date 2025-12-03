/**
 * Next.js API Route - Proxies referral stats requests to backend
 * This handles authentication and forwards requests to the backend service
 */

// Ensure this route runs on Node.js runtime (required for Firebase Admin)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// Get and normalize backend URL
function getBackendUrl(): string {
  const envUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  
  // Remove trailing slash if present
  return envUrl.replace(/\/+$/, '');
}

const BACKEND_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    // Verify Firebase token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Construct backend URL
    const url = `${BACKEND_URL}/api/v1/referral/stats`;
    
    console.log(`[Referral Stats API] Proxying GET request to: ${url}`);

    // Forward request to backend with the Firebase token
    // The backend will extract the user ID from the token
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader, // Forward auth header
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Referral Stats API] Backend returned ${response.status}: ${errorText}`);
      console.error(`[Referral Stats API] Request URL: ${url}`);
      console.error(`[Referral Stats API] BACKEND_URL: ${BACKEND_URL}`);
      
      // If it's a 404, the route might not be registered on the backend
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'Referral service endpoint not found',
            details: 'The backend referral service may not be deployed or the route is not registered. Please check backend deployment.',
            backendUrl: BACKEND_URL,
            requestedPath: '/api/v1/referral/stats'
          },
          { status: 503 }
        );
      }
      
      // Try to parse as JSON if possible
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Backend error: ${response.status}` };
      }
      
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Referral Stats API] Proxy error:', error);
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }

    if (error.message?.includes('fetch failed') || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          error: 'Unable to connect to backend service',
          details: `BACKEND_URL: ${BACKEND_URL}`
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

