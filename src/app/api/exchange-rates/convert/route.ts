import { NextRequest, NextResponse } from 'next/server';

const OXR_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID;
const OXR_BASE_URL = 'https://openexchangerates.org/api/';

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

    if (!OXR_APP_ID) {
      return NextResponse.json(
        { error: 'OPEN_EXCHANGE_RATES_APP_ID is not configured' },
        { status: 500 }
      );
    }

    // Get latest rates for both currencies
    const url = new URL(`${OXR_BASE_URL}latest.json`);
    url.searchParams.append('app_id', OXR_APP_ID);
    
    // Only request symbols if they're not the base (USD)
    const symbols = [];
    if (from !== 'USD') symbols.push(from);
    if (to !== 'USD') symbols.push(to);
    
    if (symbols.length > 0) {
      url.searchParams.append('symbols', symbols.join(','));
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || `OpenExchangeRates API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Get rates, defaulting USD to 1
    const fromRate = from === 'USD' ? 1 : data.rates[from];
    const toRate = to === 'USD' ? 1 : data.rates[to];

    if (!fromRate || !toRate) {
      return NextResponse.json(
        { error: `Currency ${from} or ${to} not found` },
        { status: 400 }
      );
    }

    // Calculate cross rate
    const rate = toRate / fromRate;
    const result = amount * rate;

    return NextResponse.json({
      success: true,
      from,
      to,
      amount,
      result,
      rate,
      timestamp: data.timestamp,
    });
  } catch (error: any) {
    console.error('Error converting currency:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
