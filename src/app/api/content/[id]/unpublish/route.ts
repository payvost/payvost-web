import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { isWriter } from '@/lib/auth-helpers';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionCookie = request.cookies.get('writer_session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized: No session found' },
        { status: 401 }
      );
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;

    const hasWriterRole = await isWriter(uid);
    if (!hasWriterRole) {
      return NextResponse.json(
        { error: 'Unauthorized: Writer access required' },
        { status: 403 }
      );
    }

    const url = `${BACKEND_URL}/api/v1/content/${params.id}/unpublish`;
    
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `writer_session=${sessionCookie}`,
        },
        signal: AbortSignal.timeout(30000),
      });
    } catch (fetchError: any) {
      console.error('Fetch error connecting to backend:', {
        url,
        error: fetchError.message,
      });
      
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Content unpublish API error:', error);
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json(
        { error: 'Session expired', message: 'Please log in again' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to unpublish content' },
      { status: 500 }
    );
  }
}

