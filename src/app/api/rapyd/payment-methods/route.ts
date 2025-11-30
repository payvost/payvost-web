import { NextRequest, NextResponse } from 'next/server';
import { rapydService } from '@/services/rapydService';
import { requireAuth } from '@/lib/api/auth';

/**
 * GET /api/rapyd/payment-methods?country=US
 * 
 * Get available payment methods for a country
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication is optional for public invoice pages
    // Check if auth header exists, but don't require it
    const authHeader = req.headers.get('authorization');
    const isAuthenticated = authHeader && authHeader.toLowerCase().startsWith('bearer ');

    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('country');

    if (!countryCode) {
      return NextResponse.json(
        { ok: false, error: 'Country code is required' },
        { status: 400 }
      );
    }

    // Get payment methods from Rapyd (works without authentication)
    const paymentMethods = await rapydService.getPaymentMethodsByCountry(countryCode);

    return NextResponse.json({ 
      ok: true, 
      paymentMethods 
    });
  } catch (err: any) {
    console.error('[Rapyd Payment Methods API] Error:', err);
    
    const message = err?.message || 'Failed to get payment methods';
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    
    return NextResponse.json(
      { 
        ok: false, 
        error: message 
      }, 
      { status }
    );
  }
}

