import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import reloadlyService from '@/server/reloadly';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const country = (searchParams.get('country') || '').trim();

    if (!country) {
      return NextResponse.json({ error: 'country is required' }, { status: 400 });
    }

    // Reloadly expects ISO2 (e.g. NG, US, GB). We accept either ISO2 or ISO3 (best-effort).
    const iso = country.length === 3 ? country.slice(0, 2) : country;
    const billers = await reloadlyService.getBillersByCountry(iso.toUpperCase());
    return NextResponse.json({ billers: Array.isArray(billers) ? billers : [] });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('GET /api/billers error:', error);
    return NextResponse.json({ error: 'Failed to fetch billers' }, { status: 500 });
  }
}

