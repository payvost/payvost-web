import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await user.getIdToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const response = await fetch(`${apiUrl}/api/support/chat/sessions/active`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active session' },
      { status: 500 }
    );
  }
}

