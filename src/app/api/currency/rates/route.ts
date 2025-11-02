import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const base = searchParams.get('base') || 'USD';
    const target = searchParams.get('target');
    
    // Build query params
    const params = new URLSearchParams({ base });
    if (target) params.set('target', target);

    // Forward request to backend service
    const backendResponse = await fetch(`${BACKEND_URL}/api/currency/rates?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.text();
      return NextResponse.json(
        { error: error || 'Failed to fetch exchange rates' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/currency/rates error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
