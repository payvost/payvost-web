import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { requireAdmin } from '@/lib/auth-helpers';
import { rapydService, RapydError, type IssuedCard } from '@/services/rapydService';

type CardUpdate = {
  status?: string;
  last4?: string;
  maskedNumber?: string;
  expiry?: string;
};

function extractLast4(card: IssuedCard, fallback?: string): string {
  return card.last4 || card.last_4 || card.pan_last_4 || fallback || '0000';
}

function extractExpiry(card: IssuedCard): string | undefined {
  if (card.expiration_date || card.expiry_date || card.exp_date) {
    return (card.expiration_date || card.expiry_date || card.exp_date) as string;
  }
  if (card.expiration_month && card.expiration_year) {
    const month = String(card.expiration_month).padStart(2, '0');
    const year = String(card.expiration_year).slice(-2);
    return `${month}/${year}`;
  }
  return undefined;
}

function normalizeStatus(status?: string): string {
  const normalized = (status || '').toLowerCase();
  if (['active', 'activated', 'open', 'enabled'].includes(normalized)) return 'active';
  if (['blocked', 'frozen', 'suspended', 'disabled'].includes(normalized)) return 'frozen';
  if (['terminated', 'closed', 'canceled', 'cancelled'].includes(normalized)) return 'terminated';
  return 'active';
}

async function syncUserCards(userId: string) {
  const userRef = adminDb.collection('users').doc(userId);
  const cardsSnap = await userRef.collection('cards').get();

  let synced = 0;
  let failed = 0;

  for (const doc of cardsSnap.docs) {
    const data = doc.data() || {};
    const providerCardId = data.providerCardId;
    if (!providerCardId || data.provider !== 'RAPYD') {
      continue;
    }

    try {
      const issued = await rapydService.getIssuedCard(providerCardId);
      const last4 = extractLast4(issued, data.last4);
      const expiry = extractExpiry(issued) || data.expiry;

      const updates: CardUpdate = {
        status: normalizeStatus(issued.status || issued.card_status),
        last4,
        maskedNumber: issued.masked_number || data.maskedNumber || `**** **** **** ${last4}`,
        expiry,
      };

      await userRef.collection('cards').doc(doc.id).set(
        {
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      synced += 1;
    } catch (error) {
      failed += 1;
      console.error(`[Cards Sync] Failed to sync card ${doc.id} for user ${userId}:`, error);
    }
  }

  return { synced, failed };
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const scope = request.nextUrl.searchParams.get('scope') || 'me';

    if (scope === 'all') {
      await requireAdmin(uid);
      const usersSnap = await adminDb.collection('users').get();

      let synced = 0;
      let failed = 0;
      for (const userDoc of usersSnap.docs) {
        const result = await syncUserCards(userDoc.id);
        synced += result.synced;
        failed += result.failed;
      }

      return NextResponse.json({ scope: 'all', synced, failed });
    }

    const result = await syncUserCards(uid);
    return NextResponse.json({ scope: 'me', ...result });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RapydError) {
      console.error('[Cards Sync API] Rapyd error:', error.message, error.response);
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode || 502 }
      );
    }
    console.error('[Cards Sync API] Failed to sync cards:', error);
    return NextResponse.json({ error: 'Failed to sync cards' }, { status: 500 });
  }
}
