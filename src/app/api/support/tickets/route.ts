import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function proxyRequest(
  request: NextRequest,
  method: string,
  endpoint: string,
  body?: any
) {
  try {
    // Get the session cookie to forward to backend
    const sessionCookie = request.cookies.get('support_session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized: No session found' },
        { status: 401 }
      );
    }

    // Forward request to backend
    const url = `${BACKEND_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cookie': `support_session=${sessionCookie}`,
    };

    // Get auth token from session if available
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

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
  return proxyRequest(request, 'GET', `/api/support/tickets?${queryString}`);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyRequest(request, 'POST', '/api/support/tickets', body);
}

