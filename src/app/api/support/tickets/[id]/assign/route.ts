import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionCookie = request.cookies.get('support_session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized: No session found' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const url = `${BACKEND_URL}/api/support/tickets/${params.id}/assign`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `support_session=${sessionCookie}`,
        ...(request.headers.get('Authorization') && {
          'Authorization': request.headers.get('Authorization')!,
        }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to assign ticket' },
      { status: 500 }
    );
  }
}

