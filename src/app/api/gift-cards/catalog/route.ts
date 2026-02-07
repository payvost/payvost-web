import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import reloadlyService from '@/server/reloadly';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('countryCode') || undefined;
    const products = await reloadlyService.getGiftCardProducts(countryCode || undefined);
    return NextResponse.json({ products: Array.isArray(products) ? products : [] });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('GET /api/gift-cards/catalog error:', error);
    return NextResponse.json({ error: 'Failed to load gift card catalog' }, { status: 500 });
  }
}

