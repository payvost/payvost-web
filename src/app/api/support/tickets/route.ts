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
    // Check if BACKEND_URL is configured
    if (!BACKEND_URL || BACKEND_URL === 'http://localhost:3001') {
      console.warn('BACKEND_URL not configured, using default:', BACKEND_URL);
    }

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
    
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(90000), // 90 seconds timeout - accounts for Render backend gateway cold start (>50s)
      });
    } catch (fetchError: any) {
      // Handle network errors (connection refused, timeout, etc.)
      console.error('Fetch error connecting to backend:', {
        url,
        error: fetchError.message,
        code: fetchError.code,
        cause: fetchError.cause,
      });
      
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        return NextResponse.json(
          { error: 'The request took too long to complete. Please try again.' },
          { status: 504 }
        );
      }
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('fetch failed')) {
        return NextResponse.json(
          { error: 'Unable to connect to our servers. Please check your internet connection and try again.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: 'Network error. Please check your connection and try again.' },
        { status: 503 }
      );
    }

    // Try to parse response as JSON
    let data: any;
    try {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      } else {
        data = {};
      }
    } catch (parseError) {
      // If response is not JSON, return error with status
      console.error('Failed to parse backend response as JSON:', {
        status: response.status,
        statusText: response.statusText,
        url,
      });
      return NextResponse.json(
        { error: `Backend returned invalid response (Status: ${response.status})` },
        { status: response.status || 500 }
      );
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Support API proxy error:', {
      error: error.message,
      stack: error.stack,
      endpoint,
    });
    return NextResponse.json(
      { error: error.message || 'Failed to proxy request to backend' },
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

