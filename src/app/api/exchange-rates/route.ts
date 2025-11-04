import { NextRequest, NextResponse } from 'next/server';

const FIXER_API_KEY = process.env.FIXER_API_KEY;
const FIXER_BASE_URL = 'https://api.fixer.io/';

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

    if (!FIXER_API_KEY) {
      return NextResponse.json(
        { error: 'FIXER_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const url = new URL(`${FIXER_BASE_URL}latest`);
    url.searchParams.append('access_key', FIXER_API_KEY);
    url.searchParams.append('base', base);
    
    if (symbols) {
      url.searchParams.append('symbols', symbols);
    }

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
        { error: data.error?.info || 'Failed to fetch exchange rates' },
        { status: 400 }
      );
    }

    // Format response
    const result = {
      success: true,
      base: data.base,
      date: data.date,
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
