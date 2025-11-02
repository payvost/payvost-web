import { NextRequest, NextResponse } from 'next/server';
import { reloadlyService } from '@/services/reloadlyService';
import { auth } from '@/lib/firebase-admin';

// GET /api/reloadly/giftcards/products?countryCode=US
export async function GET(req: NextRequest) {
  try {
    // Require Firebase auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('countryCode') || undefined;

    console.log('[Reloadly Gift Cards] Fetching products, countryCode:', countryCode);

    const products = await reloadlyService.getGiftCardProducts(countryCode);
    
    console.log('[Reloadly Gift Cards] Received:', products?.length || 0, 'products');

    return NextResponse.json({ ok: true, products });
  } catch (err: any) {
    console.error('[Reloadly Gift Cards] Error:', err);
    const message = err?.message || 'Failed to fetch gift card products';
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
