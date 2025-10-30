import { Router } from 'express';
import { StripeProvider } from './providers/stripe';
import { FedNowProvider } from './providers/fednow';
import { SEPAProvider } from './providers/sepa';
import { createPaymentIntent, getPaymentStatus } from './controllers/payment.controller';

const router = Router();

// Payment Intent Creation
router.post('/create-intent', createPaymentIntent);

// Payment Status Check
router.get('/status/:paymentId', getPaymentStatus);

// Provider-specific routes
router.post('/providers/:provider/webhook', (req, res) => {
  // Handle provider-specific webhooks
});

export default router;