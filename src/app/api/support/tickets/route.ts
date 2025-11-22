import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function proxyRequest(
  request: NextRequest,
  method: string,
  endpoint: string,
  body?: any,
  useSupportSession: boolean = false
) {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Get auth token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // If using support session, add cookie
    if (useSupportSession) {
      const sessionCookie = request.cookies.get('support_session')?.value;
      if (sessionCookie) {
        headers['Cookie'] = `support_session=${sessionCookie}`;
      }
    }

    // Forward request to backend
    const url = `${BACKEND_URL}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Support API proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to proxy request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  // GET requires support team access
  return proxyRequest(request, 'GET', `/api/support/tickets?${queryString}`, undefined, true);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Get auth token to verify user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No authentication token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token and get user ID
    let userId: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // For POST, allow customers to create tickets for themselves
    // Check if customerId matches the authenticated user
    if (body.customerId && body.customerId !== userId) {
      // If customerId doesn't match, require support team access
      const sessionCookie = request.cookies.get('support_session')?.value;
      if (!sessionCookie) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only create tickets for yourself' },
          { status: 403 }
        );
      }
      // Support team member creating ticket for another user
      return proxyRequest(request, 'POST', '/api/support/tickets', body, true);
    }

    // Customer creating ticket for themselves - use customer endpoint
    // Extract metadata if present
    const { customerId, ...ticketData } = body;
    
    // Use customer-facing endpoint
    return proxyRequest(request, 'POST', '/api/support/tickets/customer', ticketData, false);
  } catch (error: any) {
    console.error('Error in POST /api/support/tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

