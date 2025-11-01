import { Request, Response } from 'express';
import { PaymentProviderRegistry } from '../providers/registry';
import { PaymentMethod, Currency, PaymentRequestDTO, PaymentIntent } from '../interfaces';
import { determineOptimalProvider } from '../utils/routing';
import { validateAmount, validateCurrency } from '../validators';

// Temporary in-memory persistence until a Prisma model is introduced
// Shape: paymentId -> { intent, provider }
const paymentStore: Map<string, { intent: PaymentIntent; provider: string }> = new Map();

export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const paymentRequest: PaymentRequestDTO = req.body;
    
    // Validate request
    validateAmount(paymentRequest.amount);
    validateCurrency(paymentRequest.currency);
    
    // Determine optimal payment provider based on amount, currency, region, etc.
    const provider = await determineOptimalProvider(paymentRequest);
    
  // Create payment intent with chosen provider
  const intent = await provider.createPaymentIntent(paymentRequest);
    
  // Store payment intent (temporary in-memory storage)
  await savePaymentIntentToDB(intent, provider.name);
    
    res.json({
      paymentId: intent.id,
      clientSecret: intent.clientSecret,
      provider: provider.name,
      requiredFields: provider.getRequiredFields()
    });
  } catch (error: unknown) {
    console.error('Payment intent creation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
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

async function savePaymentIntentToDB(intent: PaymentIntent, provider: string): Promise<void> {
  paymentStore.set(intent.id, { intent, provider });
}

