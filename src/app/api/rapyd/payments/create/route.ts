import { NextRequest, NextResponse } from 'next/server';
import { rapydService, type CreatePaymentRequest } from '@/services/rapydService';
import { requireAuth, HttpError } from '@/lib/api/auth';

/**
 * POST /api/rapyd/payments/create
 * 
 * Create a Rapyd payment
 * Body: {
 *   amount: number,
 *   currency: string,
 *   payment_method: string,
 *   description?: string,
 *   customer?: string,
 *   metadata?: Record<string, any>,
 *   complete_payment_url?: string,
 *   error_payment_url?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const { uid } = await requireAuth(req);

    const body = await req.json();
    const {
      amount,
      currency,
      payment_method,
      description,
      customer,
      metadata,
      complete_payment_url,
      error_payment_url,
    } = body;

    // Validate required fields
    if (!amount || !currency || !payment_method) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Missing required fields: amount, currency, payment_method' 
        },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Amount must be a positive number' 
        },
        { status: 400 }
      );
    }

    // Build payment request
    const paymentRequest: CreatePaymentRequest = {
      amount,
      currency,
      payment_method,
      description: description || `Payment of ${amount} ${currency}`,
      ...(customer && { customer }),
      ...(metadata && { metadata: { ...metadata, userId: uid } }),
      ...(complete_payment_url && { complete_payment_url }),
      ...(error_payment_url && { error_payment_url }),
    };

    // Create payment via Rapyd
    const result = await rapydService.createPayment(paymentRequest);

    return NextResponse.json({ 
      ok: true, 
      payment: result 
    });
  } catch (err: any) {
    console.error('[Rapyd Payment API] Error:', err);
    
    const message = err?.message || 'Failed to create payment';
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    
    return NextResponse.json(
      { 
        ok: false, 
        error: message,
        details: err?.response || undefined
      }, 
      { status }
    );
  }
}

