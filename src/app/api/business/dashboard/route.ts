import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';
import { adminDb } from '@/lib/firebase-admin';

type FallbackDashboardData = {
  accountBalance: number;
  accountCurrency: string;
  accountName: string;
  pendingPayouts: number;
  pendingPayoutsCount: number;
  openInvoices: number;
  openInvoicesAmount: number;
  newCustomers: number;
  newCustomersChange: number;
  accountBalanceChange: number;
  accountBalanceChangePercent: number;
  recentTransactions: Array<{
    id: string;
    type: 'Credit' | 'Debit';
    description: string;
    amount: number;
    date: string;
    status: string;
    invoiceId?: string;
    transactionId?: string;
  }>;
  source: 'firestore-fallback';
};

async function buildFallbackDashboard(uid: string): Promise<FallbackDashboardData> {
  const userDoc = await adminDb.collection('users').doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const businessProfile: any = (userData as any).businessProfile || {};
  const businessId = businessProfile.id;

  let openInvoices = 0;
  let openInvoicesAmount = 0;

  if (businessId) {
    try {
      const invoicesSnapshot = await adminDb
        .collection('businessInvoices')
        .where('createdBy', '==', uid)
        .where('status', 'in', ['PENDING', 'OVERDUE'])
        .get();

      invoicesSnapshot.forEach((invoiceDoc) => {
        const invoice = invoiceDoc.data() as any;
        openInvoices += 1;
        openInvoicesAmount += parseFloat(invoice?.grandTotal?.toString() || '0');
      });
    } catch (error) {
      console.error('Fallback dashboard: failed to load invoices from Firestore', error);
    }
  }

  const wallets = (userData as any).wallets || [];
  const businessWallet = wallets.find(
    (wallet: any) => wallet?.type === 'BUSINESS' || wallet?.currency === businessProfile.currency
  );
  const accountBalance = parseFloat(businessWallet?.balance?.toString() || '0');
  const accountCurrency = businessWallet?.currency || businessProfile.currency || 'USD';

  const transactions = (userData as any).transactions || [];
  const recentTransactions = transactions
    .filter((t: any) => t.businessId === businessId || !businessId)
    .slice(0, 5)
    .map((t: any) => ({
      id: t.id || t.transactionId || `txn_${Date.now()}`,
      type: t.type || (parseFloat(t.amount) >= 0 ? 'Credit' : 'Debit'),
      description: t.description || t.note || 'Transaction',
      amount: parseFloat(t.amount || '0'),
      date: t.date || t.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      status: t.status || 'Completed',
      invoiceId: t.invoiceId,
      transactionId: t.transactionId,
    }));

  return {
    accountBalance,
    accountCurrency,
    accountName: businessProfile.name || businessProfile.legalName || 'Business Account',
    pendingPayouts: 0,
    pendingPayoutsCount: 0,
    openInvoices,
    openInvoicesAmount,
    newCustomers: 0,
    newCustomersChange: 0,
    accountBalanceChange: 0,
    accountBalanceChangePercent: 0,
    recentTransactions,
    source: 'firestore-fallback',
  };
}

export async function GET(req: NextRequest) {
  try {
    const { token, uid } = await requireAuth(req);
    const url = buildBackendUrl(`/api/business/dashboard${req.nextUrl.search}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (response.status === 404) {
      const fallback = await buildFallbackDashboard(uid);
      return NextResponse.json(fallback, { status: 200 });
    }

    return await backendResponseToNext(response);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('GET /api/business/dashboard proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

