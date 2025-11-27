import { Router } from 'express';
import { StripeProvider } from './providers/stripe';
import { FedNowProvider } from './providers/fednow';
import { SEPAProvider } from './providers/sepa';
import { createPaymentIntent, getPaymentStatus } from './controllers/payment.controller';
import { transactionLimiter } from '../../../gateway/rateLimiter';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../../gateway/middleware';

const router = Router();

// Payment Intent Creation - Requires authentication and rate limiting
router.post('/create-intent', verifyFirebaseToken, transactionLimiter, createPaymentIntent);
// Compatibility alias for existing frontend usage
router.post('/create-payment-intent', verifyFirebaseToken, transactionLimiter, createPaymentIntent);

// Payment Status Check - Requires authentication
router.get('/status/:paymentId', verifyFirebaseToken, getPaymentStatus);

// Provider-specific routes
router.post('/providers/:provider/webhook', (req, res) => {
  // Handle provider-specific webhooks
});

export default router;