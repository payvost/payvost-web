import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('support_session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized: No session found' },
        { status: 401 }
      );
    }

    const url = `${BACKEND_URL}/api/support/chat/queue`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': `support_session=${sessionCookie}`,
        ...(request.headers.get('Authorization') && {
          'Authorization': request.headers.get('Authorization')!,
        }),
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat queue' },
      { status: 500 }
    );
  }
}

