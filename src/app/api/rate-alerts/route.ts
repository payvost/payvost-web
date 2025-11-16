import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Body = {
  sourceCurrency: string;
  targetCurrency: string;
  targetRate: number | string;
  email?: string | null;
  pushSubscription?: any;
};

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();

    const { sourceCurrency, targetCurrency, targetRate, email, pushSubscription } = body;

    if (!sourceCurrency || !targetCurrency || targetRate === undefined || targetRate === null) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const rateNum = typeof targetRate === 'string' ? parseFloat(targetRate) : Number(targetRate);
    if (Number.isNaN(rateNum) || rateNum <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid targetRate' }, { status: 400 });
    }

    // Basic currency code sanitization
    const sc = sourceCurrency.trim().toUpperCase();
    const tc = targetCurrency.trim().toUpperCase();

    // Create alert record. Store targetRate as string (Prisma Decimal accepts string)
    const alert = await prisma.rateAlert.create({
      data: {
        email: email || null,
        pushSubscription: pushSubscription || null,
        sourceCurrency: sc,
        targetCurrency: tc,
        targetRate: rateNum.toString(),
      },
    });

    return NextResponse.json({ success: true, alert });
  } catch (err) {
    console.error('POST /api/rate-alerts error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
