import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Cast options to any to avoid a strict type mismatch with installed Stripe types
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY! as string, { apiVersion: '2025-01-27' } as any);

export async function POST(req: Request) {
  try {
    const { amount, currency, invoiceId, userId } = await req.json();

    // userId is optional; require amount, currency and invoiceId only
    if (!amount || !currency || !invoiceId) {
      return NextResponse.json({ error: 'Missing parameters: amount, currency and invoiceId are required' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in smallest unit
      currency,
      metadata: {
        invoiceId,
        userId
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
