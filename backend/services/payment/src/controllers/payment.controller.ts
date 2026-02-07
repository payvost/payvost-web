import { Request, Response } from 'express';
import { PaymentProviderRegistry } from '../providers/registry';
import { PaymentMethod, Currency, PaymentRequestDTO, PaymentIntent } from '../interfaces';
import { determineOptimalProvider } from '../utils/routing';
import { validateAmount, validateCurrency, validateIdempotencyKey } from '../validators';
import { AuthenticatedRequest } from '../../../../gateway/auth-middleware';
import { ValidationError } from '../../../../gateway/index';
import { prisma } from '../../../../common/prisma';

function mapStatusToString(status: any): string {
  return typeof status === 'string' ? status : String(status || 'PENDING');
}

export async function createPaymentIntent(req: AuthenticatedRequest, res: Response) {
  try {
    const paymentRequest: PaymentRequestDTO = req.body;
    const uid = (req as any).user?.uid as string | undefined;
    
    // Validate idempotency key is required
    if (!paymentRequest.idempotencyKey) {
      throw new ValidationError('idempotencyKey is required for payment operations');
    }
    
    // Validate idempotency key format
    await validateIdempotencyKey(paymentRequest.idempotencyKey);
    
    // Check if payment with this idempotency key already exists
    const existingPayment = await prisma.paymentIntentRecord.findUnique({
      where: { idempotencyKey: paymentRequest.idempotencyKey },
    });
    if (existingPayment) {
      const provider = PaymentProviderRegistry.get(existingPayment.provider);
      return res.json({
        paymentId: existingPayment.providerRef,
        clientSecret: existingPayment.clientSecret,
        provider: existingPayment.provider,
        requiredFields: provider?.getRequiredFields() || [],
        message: 'Payment intent already exists (idempotent)'
      });
    }
    
    // Validate request
    validateAmount(paymentRequest.amount);
    validateCurrency(paymentRequest.currency);
    
    // Determine optimal payment provider based on amount, currency, region, etc.
    const provider = await determineOptimalProvider(paymentRequest);
    
    // Create payment intent with chosen provider
    const intent = await provider.createPaymentIntent(paymentRequest);
    
    // Store payment intent with idempotency key as key
    await savePaymentIntentToDB(intent, provider.name, paymentRequest.idempotencyKey, paymentRequest, uid);
    
    res.json({
      paymentId: intent.id,
      clientSecret: intent.clientSecret,
      provider: provider.name,
      requiredFields: provider.getRequiredFields()
    });
  } catch (error: unknown) {
    console.error('Payment intent creation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const statusCode = error instanceof ValidationError ? 400 : 500;
    res.status(statusCode).json({ error: errorMessage });
  }
}

export async function getPaymentStatus(req: Request, res: Response) {
  try {
    const { paymentId } = req.params;
    const payment = await getPaymentFromDB(paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const provider = PaymentProviderRegistry.get(payment.provider);
    if (!provider) {
      return res.status(500).json({ error: `Provider ${payment.provider} not configured` });
    }
    const status = await provider.getPaymentStatus(paymentId);
    
    res.json({ status });
  } catch (error: unknown) {
    console.error('Payment status check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
}

async function getPaymentFromDB(paymentId: string): Promise<{ provider: string } | null> {
  const record = await prisma.paymentIntentRecord.findFirst({
    where: { providerRef: paymentId },
    select: { provider: true },
  });
  return record || null;
}

async function savePaymentIntentToDB(
  intent: PaymentIntent,
  provider: string,
  idempotencyKey: string,
  request: PaymentRequestDTO,
  uid?: string
): Promise<void> {
  const userId = (uid || request?.metadata?.userId || (request as any)?.userId || null) as string | null;
  const accountId = (request?.metadata?.accountId || null) as string | null;

  if (!userId) {
    // Best-effort: derive from authenticated request on the server side when present.
    // For safety, we still persist with "unknown" userId only if we have accountId.
  }

  if (!accountId) {
    // We still persist the record for status tracking, but wallet top-ups require accountId.
  }

  await prisma.paymentIntentRecord.upsert({
    where: { idempotencyKey },
    update: {
      provider,
      providerRef: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: mapStatusToString(intent.status),
      clientSecret: intent.clientSecret || null,
      metadata: intent.metadata || request.metadata || undefined,
      userId: userId || 'unknown',
      accountId: accountId || 'unknown',
    },
    create: {
      userId: userId || 'unknown',
      accountId: accountId || 'unknown',
      provider,
      providerRef: intent.id,
      idempotencyKey,
      amount: intent.amount,
      currency: intent.currency,
      status: mapStatusToString(intent.status),
      clientSecret: intent.clientSecret || null,
      metadata: intent.metadata || request.metadata || undefined,
    },
  });
}

