import { NextRequest, NextResponse } from 'next/server';

const FIXER_API_KEY = process.env.FIXER_API_KEY;
const FIXER_BASE_URL = 'https://api.fixer.io/';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, amount } = body;

    if (!from || !to || amount === undefined) {
      return NextResponse.json(
        { error: 'from, to, and amount are required' },
        { status: 400 }
      );
    }

    if (!FIXER_API_KEY) {
      return NextResponse.json(
        { error: 'FIXER_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const url = new URL(`${FIXER_BASE_URL}convert`);
    url.searchParams.append('access_key', FIXER_API_KEY);
    url.searchParams.append('from', from);
    url.searchParams.append('to', to);
    url.searchParams.append('amount', amount.toString());

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Fixer API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json(
        { error: data.error?.info || 'Failed to convert currency' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      from: data.query.from,
      to: data.query.to,
      amount: data.query.amount,
      result: data.result,
      rate: data.info.rate,
      timestamp: data.info.timestamp,
      date: data.date,
    });
  } catch (error: any) {
    console.error('Error converting currency:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
