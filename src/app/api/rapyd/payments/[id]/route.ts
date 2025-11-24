import { NextRequest, NextResponse } from 'next/server';
import { rapydService } from '@/services/rapydService';
import { requireAuth } from '@/lib/api/auth';

/**
 * GET /api/rapyd/payments/[id]
 * 
 * Get payment status by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await requireAuth(req);

    const paymentId = params.id;

    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get payment from Rapyd
    const payment = await rapydService.getPayment(paymentId);

    return NextResponse.json({ 
      ok: true, 
      payment 
    });
  } catch (err: any) {
    console.error('[Rapyd Payment API] Error getting payment:', err);
    
    const message = err?.message || 'Failed to get payment';
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

