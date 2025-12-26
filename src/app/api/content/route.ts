import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { isWriter } from '@/lib/auth-helpers';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function proxyRequest(
  request: NextRequest,
  method: string,
  endpoint: string,
  body?: any
) {
  try {
    // Verify writer session cookie
    const sessionCookie = request.cookies.get('writer_session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized: No session found' },
        { status: 401 }
      );
    }

    // Verify session cookie and get user info
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;

    // Verify user has writer role
    const hasWriterRole = await isWriter(uid);
    if (!hasWriterRole) {
      return NextResponse.json(
        { error: 'Unauthorized: Writer access required' },
        { status: 403 }
      );
    }

    // Create a custom token for backend authentication
    // Forward request to backend with session cookie
    // Backend middleware now supports session cookies
    const url = `${BACKEND_URL}/api/v1/content${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cookie': `writer_session=${sessionCookie}`, // Backend middleware now supports session cookies
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(90000), // 90 seconds timeout - accounts for Render backend gateway cold start (>50s)
      });
    } catch (fetchError: any) {
      console.error('Fetch error connecting to backend:', {
        url,
        error: fetchError.message,
        code: fetchError.code,
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

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Content API proxy error:', error);
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json(
        { error: 'Session expired', message: 'Please log in again' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to proxy request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const endpoint = queryString ? `?${queryString}` : '';
  return proxyRequest(request, 'GET', endpoint);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyRequest(request, 'POST', '', body);
}

