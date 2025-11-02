import { NextRequest, NextResponse } from 'next/server';

const FIXER_API_KEY = process.env.FIXER_API_KEY || '228793b424835fd85f1ca3d53d11d552';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

const rateCache = new Map<string, CacheEntry>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const base = searchParams.get('base') || 'USD';
    const symbols = searchParams.get('symbols');

    const cacheKey = `${base}:${symbols || 'all'}`;
    const cached = rateCache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    // Fetch from Fixer.io API
    let fixerUrl = `https://api.fixer.io/latest?access_key=${FIXER_API_KEY}&base=${base}`;
    if (symbols) {
      fixerUrl += `&symbols=${symbols}`;
    }

    const fixerResponse = await fetch(fixerUrl);
    
    if (!fixerResponse.ok) {
      console.error('Fixer.io API error:', await fixerResponse.text());
      
      // Return fallback mock rates
      const fallbackRates = {
        success: true,
        timestamp: Date.now(),
        base,
        date: new Date().toISOString().split('T')[0],
        rates: {
          EUR: 0.85,
          GBP: 0.73,
          JPY: 110.0,
          NGN: 411.5,
          USD: base === 'USD' ? 1 : 1.18,
        },
      };
      
      return NextResponse.json(fallbackRates);
    }

    const data = await fixerResponse.json();
    
    if (!data.success) {
      console.error('Fixer.io API error:', data.error);
      
      // Return fallback mock rates
      const fallbackRates = {
        success: true,
        timestamp: Date.now(),
        base,
        date: new Date().toISOString().split('T')[0],
        rates: {
          EUR: 0.85,
          GBP: 0.73,
          JPY: 110.0,
          NGN: 411.5,
          USD: base === 'USD' ? 1 : 1.18,
        },
      };
      
      return NextResponse.json(fallbackRates);
    }

    // Cache the successful response
    rateCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/currency/rates error:', error);
    
    // Return fallback mock rates on error
    const base = new URL(req.url).searchParams.get('base') || 'USD';
    const fallbackRates = {
      success: true,
      timestamp: Date.now(),
      base,
      date: new Date().toISOString().split('T')[0],
      rates: {
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
        NGN: 411.5,
        USD: base === 'USD' ? 1 : 1.18,
      },
    };
    
    return NextResponse.json(fallbackRates);
  }
}
