/**
 * Next.js API Route - Proxies referral campaign requests to backend
 * This handles authentication and forwards requests to the backend service
 */

// Ensure this route runs on Node.js runtime (required for Firebase Admin)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { isAdmin } from '@/lib/auth-helpers';

// Get and normalize backend URL
function getBackendUrl(): string {
  const envUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  
  // Remove trailing slash if present
  return envUrl.replace(/\/+$/, '');
}

const BACKEND_URL = getBackendUrl();

async function proxyRequest(
  request: NextRequest,
  method: string,
  endpoint: string,
  body?: any
) {
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

    // Check if user is admin using Firestore (not custom claims)
    const hasAdminAccess = await isAdmin(decodedToken.uid);
    
    if (!hasAdminAccess) {
      console.error(`[Referral Campaigns API] Access denied for user: ${decodedToken.uid}`);
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Construct backend URL - ensure no double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${BACKEND_URL}/api/v1/referral${cleanEndpoint}`;
    
    console.log(`[Referral Campaigns API] Proxying ${method} request to: ${url}`);
    console.log(`[Referral Campaigns API] BACKEND_URL: ${BACKEND_URL}, endpoint: ${cleanEndpoint}`);
    if (body) {
      console.log(`[Referral Campaigns API] Request body:`, JSON.stringify(body, null, 2));
    }

    // Forward request to backend
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader, // Forward auth header
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      // Try to parse as JSON first, fallback to text
      let errorData: any;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: await response.text().catch(() => 'Unknown error') };
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        errorData = { error: errorText };
      }
      
      console.error(`[Referral Campaigns API] Backend returned ${response.status}:`, JSON.stringify(errorData, null, 2));
      
      return NextResponse.json(
        { 
          error: errorData.error || errorData.message || `Backend error: ${response.status}`,
          message: errorData.message || errorData.error || 'An unexpected error occurred',
          details: errorData.details || errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Referral Campaigns API] Proxy error:', error);
    
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const stats = searchParams.get('stats');
  
  let endpoint = '/admin/campaigns';
  
  if (id && stats === 'true') {
    endpoint = `/admin/campaigns/${id}/stats`;
  } else if (id) {
    endpoint = `/admin/campaigns/${id}`;
  } else {
    // Add query parameters for filtering
    const queryParams = new URLSearchParams();
    if (searchParams.get('isActive')) queryParams.set('isActive', searchParams.get('isActive')!);
    if (searchParams.get('startDate')) queryParams.set('startDate', searchParams.get('startDate')!);
    if (searchParams.get('endDate')) queryParams.set('endDate', searchParams.get('endDate')!);
    
    const queryString = queryParams.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
  }

  return proxyRequest(request, 'GET', endpoint);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyRequest(request, 'POST', '/admin/campaigns', body);
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: 'Campaign ID required' },
      { status: 400 }
    );
  }

  const body = await request.json();
  return proxyRequest(request, 'PUT', `/admin/campaigns/${id}`, body);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const hard = searchParams.get('hard');
  
  if (!id) {
    return NextResponse.json(
      { error: 'Campaign ID required' },
      { status: 400 }
    );
  }

  const queryString = hard === 'true' ? '?hard=true' : '';
  return proxyRequest(request, 'DELETE', `/admin/campaigns/${id}${queryString}`);
}

