import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-09-30.clover' });

export async function POST(req: Request) {
  try {
    const { amount, currency, invoiceId, userId } = await req.json();

    if (!amount || !currency || !invoiceId || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
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
