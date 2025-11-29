import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { isWriter } from '@/lib/auth-helpers';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function proxyRequest(
  request: NextRequest,
  method: string,
  id: string,
  endpoint: string = '',
  body?: any
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

    const url = `${BACKEND_URL}/api/v1/content/${id}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cookie': `writer_session=${sessionCookie}`, // Backend middleware now supports session cookies
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Content API proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to proxy request' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, 'GET', params.id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => ({}));
  return proxyRequest(request, 'PATCH', params.id, '', body);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, 'DELETE', params.id);
}

