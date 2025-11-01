/**
 * Reloadly Webhook Handler
 * 
 * Handles webhook callbacks from Reloadly for:
 * - Airtime/Data topup status updates
 * - Gift card order confirmations
 * - Bill payment confirmations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { ENV_VARIABLES, RELOADLY } from '@/config/integration-partners';

/**
 * Webhook event types
 */
type WebhookEvent = 
  | 'topup.success'
  | 'topup.failed'
  | 'giftcard.order.success'
  | 'giftcard.order.failed'
  | 'bill.payment.success'
  | 'bill.payment.failed';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: {
    transactionId: number;
    customIdentifier?: string;
    status: string;
    [key: string]: any;
  };
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return digest === signature;
}

/**
 * Handle topup success
 */
async function handleTopupSuccess(data: any) {
  console.log('Topup successful:', data);
  
  // TODO: Update transaction status in database
  // TODO: Update wallet balance
  // TODO: Send notification to user
  // TODO: Log transaction for audit
  
  return {
    success: true,
    message: 'Topup success processed',
  };
}

/**
 * Handle topup failure
 */
async function handleTopupFailed(data: any) {
  console.log('Topup failed:', data);
  
  // TODO: Update transaction status in database
  // TODO: Refund user if payment was deducted
  // TODO: Send notification to user
  // TODO: Log error for investigation
  
  return {
    success: true,
    message: 'Topup failure processed',
  };
}

/**
 * Handle gift card order success
 */
async function handleGiftCardSuccess(data: any) {
  console.log('Gift card order successful:', data);
  
  // TODO: Update order status in database
  // TODO: Store redeem codes
  // TODO: Send gift card details to recipient
  // TODO: Update wallet balance
  // TODO: Send notification to user
  
  return {
    success: true,
    message: 'Gift card order success processed',
  };
}

/**
 * Handle gift card order failure
 */
async function handleGiftCardFailed(data: any) {
  console.log('Gift card order failed:', data);
  
  // TODO: Update order status in database
  // TODO: Refund user if payment was deducted
  // TODO: Send notification to user
  // TODO: Log error for investigation
  
  return {
    success: true,
    message: 'Gift card order failure processed',
  };
}

/**
 * Handle bill payment success
 */
async function handleBillPaymentSuccess(data: any) {
  console.log('Bill payment successful:', data);
  
  // TODO: Update transaction status in database
  // TODO: Update wallet balance
  // TODO: Store payment receipt
  // TODO: Send notification to user
  // TODO: Log transaction for audit
  
  return {
    success: true,
    message: 'Bill payment success processed',
  };
}

/**
 * Handle bill payment failure
 */
async function handleBillPaymentFailed(data: any) {
  console.log('Bill payment failed:', data);
  
  // TODO: Update transaction status in database
  // TODO: Refund user if payment was deducted
  // TODO: Send notification to user
  // TODO: Log error for investigation
  
  return {
    success: true,
    message: 'Bill payment failure processed',
  };
}

/**
 * Route webhook to appropriate handler
 */
async function handleWebhookEvent(payload: WebhookPayload) {
  const { event, data } = payload;

  switch (event) {
    case RELOADLY.WEBHOOKS.TOPUP_SUCCESS:
      return handleTopupSuccess(data);
      
    case RELOADLY.WEBHOOKS.TOPUP_FAILED:
      return handleTopupFailed(data);
      
    case RELOADLY.WEBHOOKS.GIFTCARD_ORDER_SUCCESS:
      return handleGiftCardSuccess(data);
      
    case RELOADLY.WEBHOOKS.GIFTCARD_ORDER_FAILED:
      return handleGiftCardFailed(data);
      
    case RELOADLY.WEBHOOKS.BILL_PAYMENT_SUCCESS:
      return handleBillPaymentSuccess(data);
      
    case RELOADLY.WEBHOOKS.BILL_PAYMENT_FAILED:
      return handleBillPaymentFailed(data);
      
    default:
      console.warn('Unknown webhook event:', event);
      return {
        success: false,
        message: `Unknown event type: ${event}`,
      };
  }
}

/**
 * POST /api/webhooks/reloadly
 * 
 * Receive and process webhooks from Reloadly
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret
    const webhookSecret = ENV_VARIABLES.RELOADLY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Reloadly webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Get request body as text for signature verification
    const bodyText = await request.text();
    
    // Get signature from headers
    const signature = request.headers.get('x-reloadly-signature') || 
                     request.headers.get('x-webhook-signature') ||
                     '';

    // Verify signature
    if (!verifyWebhookSignature(bodyText, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload: WebhookPayload = JSON.parse(bodyText);

    // Log webhook receipt
    console.log('Received Reloadly webhook:', {
      event: payload.event,
      transactionId: payload.data?.transactionId,
      timestamp: payload.timestamp,
    });

    // Handle the webhook event
    const result = await handleWebhookEvent(payload);

    // Return success response
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('Error processing Reloadly webhook:', error);
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/reloadly
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Reloadly webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
