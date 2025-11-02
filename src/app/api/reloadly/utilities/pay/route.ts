import { NextRequest, NextResponse } from 'next/server';
import { reloadlyService, type BillPaymentRequest } from '@/services/reloadlyService';
import { auth } from '@/lib/firebase-admin';

// POST /api/reloadly/utilities/pay
// Body: { billerId, subscriberAccountNumber, amount, customIdentifier?, referenceId? }
export async function POST(req: NextRequest) {
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

    const body = (await req.json()) as Partial<BillPaymentRequest>;

    if (!body || !body.billerId || !body.subscriberAccountNumber || !body.amount) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: billerId, subscriberAccountNumber, amount' },
        { status: 400 }
      );
    }

    const result = await reloadlyService.payBill({
      billerId: Number(body.billerId),
      subscriberAccountNumber: String(body.subscriberAccountNumber),
      amount: Number(body.amount),
      customIdentifier: body.customIdentifier,
      referenceId: body.referenceId,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    const message = err?.message || 'Failed to pay bill';
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
