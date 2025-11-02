import { NextRequest, NextResponse } from 'next/server';
import { reloadlyService } from '@/services/reloadlyService';
import { auth } from '@/lib/firebase-admin';

// GET /api/reloadly/utilities/billers?countryCode=NG
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
    const countryCode = searchParams.get('countryCode');

    console.log('[Reloadly Billers] Fetching for country:', countryCode);

    const billers = countryCode
      ? await reloadlyService.getBillersByCountry(countryCode)
      : await reloadlyService.getBillers();

    console.log('[Reloadly Billers] Received:', billers?.length || 0, 'billers');

    return NextResponse.json({ ok: true, billers });
  } catch (err: any) {
    console.error('[Reloadly Billers] Error:', err);
    const message = err?.message || 'Failed to fetch billers';
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
