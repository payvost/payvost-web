import { Request, Response } from 'express';
import { PaymentProviderRegistry } from '../providers/registry';
import { PaymentMethod, Currency, PaymentRequestDTO, PaymentIntent } from '../interfaces';
import { determineOptimalProvider } from '../utils/routing';
import { validateAmount, validateCurrency, validateIdempotencyKey } from '../validators';
import { AuthenticatedRequest } from '../../../../gateway/auth-middleware';
import { ValidationError } from '../../../../gateway/index';

// Temporary in-memory persistence until a Prisma model is introduced
// Shape: paymentId -> { intent, provider }
const paymentStore: Map<string, { intent: PaymentIntent; provider: string }> = new Map();

export async function createPaymentIntent(req: AuthenticatedRequest, res: Response) {
  try {
    const paymentRequest: PaymentRequestDTO = req.body;
    
    // Validate idempotency key is required
    if (!paymentRequest.idempotencyKey) {
      throw new ValidationError('idempotencyKey is required for payment operations');
    }
    
    // Validate idempotency key format
    await validateIdempotencyKey(paymentRequest.idempotencyKey);
    
    // Check if payment with this idempotency key already exists
    const existingPayment = paymentStore.get(paymentRequest.idempotencyKey);
    if (existingPayment) {
      return res.json({
        paymentId: existingPayment.intent.id,
        clientSecret: existingPayment.intent.clientSecret,
        provider: existingPayment.provider,
        requiredFields: PaymentProviderRegistry.get(existingPayment.provider)?.getRequiredFields() || [],
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
    await savePaymentIntentToDB(intent, provider.name, paymentRequest.idempotencyKey);
    
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
    const status = await provider.getPaymentStatus(paymentId);
    
    res.json({ status });
  } catch (error: unknown) {
    console.error('Payment status check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
}

async function getPaymentFromDB(paymentId: string): Promise<{ intent: PaymentIntent; provider: string } | null> {
  const record = paymentStore.get(paymentId) || null;
  return record;
}

async function savePaymentIntentToDB(intent: PaymentIntent, provider: string, idempotencyKey: string): Promise<void> {
  // Store by both payment ID and idempotency key for lookup
  paymentStore.set(intent.id, { intent, provider });
  paymentStore.set(idempotencyKey, { intent, provider });
}

