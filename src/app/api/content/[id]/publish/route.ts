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

    const url = `${BACKEND_URL}/api/v1/content/${params.id}/publish`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `writer_session=${sessionCookie}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Content publish API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish content' },
      { status: 500 }
    );
  }
}

