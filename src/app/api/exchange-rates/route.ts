import { NextRequest, NextResponse } from 'next/server';

const OXR_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID;
const OXR_BASE_URL = 'https://openexchangerates.org/api/';

// In-memory cache to reduce API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const base = searchParams.get('base') || 'USD';
    const symbols = searchParams.get('symbols');
    
    // Check cache
    const cacheKey = `${base}-${symbols || 'all'}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    if (!OXR_APP_ID) {
      return NextResponse.json(
        { error: 'OPEN_EXCHANGE_RATES_APP_ID is not configured' },
        { status: 500 }
      );
    }

    const url = new URL(`${OXR_BASE_URL}latest.json`);
    url.searchParams.append('app_id', OXR_APP_ID);
    
    // Note: Changing base currency requires paid plan, free plan is USD only
    if (base !== 'USD') {
      url.searchParams.append('base', base);
    }
    
    if (symbols) {
      url.searchParams.append('symbols', symbols);
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

    // Format response
    const result = {
      success: true,
      base: data.base,
      timestamp: data.timestamp,
      rates: data.rates,
    };

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
