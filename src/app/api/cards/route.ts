import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { rapydService, type IssuedCard, type CreateIssuedCardRequest, RapydError } from '@/services/rapydService';
import { ENV_VARIABLES } from '@/config/integration-partners';
import type { CardStatus, CreateVirtualCardInput, VirtualCardData } from '@/types/virtual-card';

const DEFAULT_CARD_TYPE = ENV_VARIABLES.RAPYD_ISSUING_CARD_TYPE || 'virtual';

function normalizeStatus(status?: string): CardStatus {
  const normalized = (status || '').toLowerCase();
  if (['active', 'activated', 'open', 'enabled'].includes(normalized)) return 'active';
  if (['blocked', 'frozen', 'suspended', 'disabled'].includes(normalized)) return 'frozen';
  if (['terminated', 'closed', 'canceled', 'cancelled'].includes(normalized)) return 'terminated';
  return 'active';
}

function extractLast4(card: IssuedCard, fallback?: string): string {
  return (
    card.last4 ||
    card.last_4 ||
    card.pan_last_4 ||
    fallback ||
    '0000'
  );
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

function normalizeCard(data: Partial<VirtualCardData> & { id?: string }): VirtualCardData {
  return {
    id: data.id || `vc_${Date.now()}`,
    cardLabel: data.cardLabel || 'Virtual Card',
    last4: data.last4 || '0000',
    cardType: data.cardType || 'visa',
    expiry: data.expiry,
    cvv: data.cvv,
    balance: typeof data.balance === 'number' ? data.balance : 0,
    currency: data.currency || 'USD',
    theme: data.theme || 'blue',
    status: data.status || 'active',
    fullNumber: data.fullNumber,
    maskedNumber: data.maskedNumber,
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    spendingLimit: data.spendingLimit,
    cardModel: data.cardModel || 'debit',
    availableCredit: data.availableCredit,
    provider: data.provider,
    providerCardId: data.providerCardId,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};

    const cards: VirtualCardData[] = [];
    const seenIds = new Set<string>();

    const subcollectionSnap = await userRef.collection('cards').get();
    subcollectionSnap.forEach((doc) => {
      const data = doc.data() || {};
      const card = normalizeCard({ id: doc.id, ...data });
      cards.push(card);
      seenIds.add(card.id);
    });

    if (Array.isArray(userData.cards)) {
      userData.cards.forEach((card: any) => {
        const normalized = normalizeCard({ ...card });
        if (!seenIds.has(normalized.id)) {
          cards.push(normalized);
          seenIds.add(normalized.id);
        }
      });
    }

    return NextResponse.json({ cards });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[Cards API] Failed to fetch cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const body = (await request.json()) as CreateVirtualCardInput & {
      issuing?: Record<string, any>;
    };

    if (!body?.cardLabel || !body.cardModel || !body.cardType || !body.theme) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cardProgramId = ENV_VARIABLES.RAPYD_CARD_PROGRAM_ID;
    const issuingCountry = ENV_VARIABLES.RAPYD_ISSUING_COUNTRY;
    const issuingCurrency = ENV_VARIABLES.RAPYD_ISSUING_CURRENCY;

    if (!cardProgramId || !issuingCountry || !issuingCurrency) {
      return NextResponse.json(
        { error: 'Rapyd issuing configuration missing' },
        { status: 500 }
      );
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};

    const rapydWalletId =
      userData.rapydWalletId ||
      userData.rapyd?.walletId ||
      userData.rapyd_ewallet;

    if (!rapydWalletId) {
      return NextResponse.json(
        { error: 'Rapyd wallet not found for user' },
        { status: 400 }
      );
    }

    const issuingOverrides = body.issuing && typeof body.issuing === 'object' ? body.issuing : {};

    const issuingPayload: CreateIssuedCardRequest = {
      ewallet: rapydWalletId,
      card_program: cardProgramId,
      country: issuingCountry,
      currency: issuingCurrency,
      card_type: DEFAULT_CARD_TYPE,
      description: body.cardLabel,
      metadata: {
        uid,
        cardLabel: body.cardLabel,
        cardModel: body.cardModel,
        cardType: body.cardType,
        theme: body.theme,
        ...(issuingOverrides?.metadata || {}),
      },
      ...issuingOverrides,
    };

    const issuedCard = await rapydService.createIssuedCard(issuingPayload);
    const last4 = extractLast4(issuedCard);
    const expiry = extractExpiry(issuedCard);

    const recordId = issuedCard.id || `vc_${Date.now()}`;
    const cardRecord: VirtualCardData = normalizeCard({
      id: recordId,
      provider: 'RAPYD',
      providerCardId: issuedCard.id || recordId,
      cardLabel: body.cardLabel,
      last4,
      cardType: body.cardType,
      expiry,
      balance: 0,
      currency: issuingCurrency,
      theme: body.theme,
      status: normalizeStatus(issuedCard.status || issuedCard.card_status),
      maskedNumber: issuedCard.masked_number || `**** **** **** ${last4}`,
      transactions: [],
      spendingLimit: body.spendingLimit,
      cardModel: body.cardModel,
      availableCredit: body.cardModel === 'credit' ? body.spendingLimit?.amount || 0 : undefined,
    });

    await userRef.collection('cards').doc(recordId).set({
      ...cardRecord,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ card: cardRecord }, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RapydError) {
      console.error('[Cards API] Rapyd error:', error.message, error.response);
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode || 502 }
      );
    }
    console.error('[Cards API] Failed to create card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}
