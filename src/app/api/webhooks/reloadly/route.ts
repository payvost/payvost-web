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
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/services/notificationService';

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
    amount?: number;
    currency?: string;
    recipientPhone?: string;
    [key: string]: any;
  };
}

/**
 * Verify webhook signature using constant-time comparison
 * Prevents timing attacks
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  
  // Use constant-time comparison to prevent timing attacks
  if (signature.length !== digest.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ digest.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Handle topup success
 */
async function handleTopupSuccess(data: any) {
  console.log('Topup successful:', data);
  
  try {
    // Extract transaction ID from custom identifier (format: "topup-{userId}-{accountId}-{timestamp}")
    const customId = data.customIdentifier;
    const [, userId, accountId] = customId?.split('-') || [];

    // Update transaction status in database
    await prisma.externalTransaction.upsert({
      where: {
        providerTransactionId: data.transactionId?.toString() || `reloadly-${data.transactionId}`,
      },
      update: {
        status: 'COMPLETED',
        webhookReceived: true,
        webhookData: data,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: userId || 'unknown',
        accountId: accountId || null,
        provider: 'RELOADLY',
        providerTransactionId: data.transactionId?.toString() || `reloadly-${data.transactionId}`,
        type: 'AIRTIME_TOPUP',
        status: 'COMPLETED',
        amount: data.amount || 0,
        currency: data.currency || 'USD',
        recipientDetails: {
          phone: data.recipientPhone,
          operator: data.operatorName,
        },
        metadata: data,
        webhookReceived: true,
        webhookData: data,
        completedAt: new Date(),
      },
    });

    console.log('Transaction updated successfully');
    
    // Send email notification to user
    if (userId && userId !== 'unknown') {
      try {
        // Fetch user details from database or use from webhook data
        // For now, using placeholder - in production, fetch from User table
        await notificationService.notifyExternalTransaction({
          userId,
          userEmail: data.userEmail || 'user@example.com', // TODO: Fetch from user record
          userName: data.userName || 'User', // TODO: Fetch from user record
          type: 'success',
          transactionType: 'airtime_topup',
          details: {
            phoneNumber: data.recipientPhone,
            operatorName: data.operatorName,
            amount: data.amount,
            currency: data.currency || 'USD',
            transactionId: data.transactionId,
          },
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the webhook if notification fails
      }
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
  }
  
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
  
  try {
    const customId = data.customIdentifier;
    const [, userId, accountId] = customId?.split('-') || [];

    // Update transaction status
    await prisma.externalTransaction.upsert({
      where: {
        providerTransactionId: data.transactionId?.toString() || `reloadly-${data.transactionId}`,
      },
      update: {
        status: 'FAILED',
        errorMessage: data.errorMessage || data.failureReason || 'Topup failed',
        webhookReceived: true,
        webhookData: data,
        updatedAt: new Date(),
      },
      create: {
        userId: userId || 'unknown',
        accountId: accountId || null,
        provider: 'RELOADLY',
        providerTransactionId: data.transactionId?.toString() || `reloadly-${data.transactionId}`,
        type: 'AIRTIME_TOPUP',
        status: 'FAILED',
        amount: data.amount || 0,
        currency: data.currency || 'USD',
        errorMessage: data.errorMessage || data.failureReason || 'Topup failed',
        metadata: data,
        webhookReceived: true,
        webhookData: data,
      },
    });

    // Refund user if payment was deducted
    // TODO: Implement refund logic
    
    // Send notification to user about failed transaction
    if (userId && userId !== 'unknown') {
      try {
        await notificationService.sendEmail({
          to: data.userEmail || 'user@example.com', // TODO: Fetch from user record
          subject: 'Airtime Top-up Failed',
          template: 'transaction_failed',
          variables: {
            name: data.userName || 'User', // TODO: Fetch from user record
            reason: data.errorMessage || data.failureReason || 'Topup failed',
            amount: data.amount,
            currency: data.currency || 'USD',
            date: new Date().toLocaleString(),
          },
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }
  } catch (error) {
    console.error('Error updating failed transaction:', error);
  }
  
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
  
  try {
    const customId = data.customIdentifier;
    const [, userId, accountId] = customId?.split('-') || [];

    // Update transaction status in database
    await prisma.externalTransaction.upsert({
      where: {
        providerTransactionId: data.transactionId?.toString() || `reloadly-gc-${data.transactionId}`,
      },
      update: {
        status: 'COMPLETED',
        webhookReceived: true,
        webhookData: data,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: userId || 'unknown',
        accountId: accountId || null,
        provider: 'RELOADLY',
        providerTransactionId: data.transactionId?.toString() || `reloadly-gc-${data.transactionId}`,
        type: 'GIFT_CARD',
        status: 'COMPLETED',
        amount: data.amount || 0,
        currency: data.currencyCode || 'USD',
        recipientDetails: {
          email: data.recipientEmail,
          productName: data.productName,
        },
        metadata: data,
        webhookReceived: true,
        webhookData: data,
        completedAt: new Date(),
      },
    });

    // TODO: Store redeem codes
    // TODO: Send gift card details to recipient
  } catch (error) {
    console.error('Error updating gift card transaction:', error);
  }
  
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
  
  try {
    const customId = data.customIdentifier;
    const [, userId, accountId] = customId?.split('-') || [];

    await prisma.externalTransaction.upsert({
      where: {
        providerTransactionId: data.transactionId?.toString() || `reloadly-gc-${data.transactionId}`,
      },
      update: {
        status: 'FAILED',
        errorMessage: data.errorMessage || 'Gift card order failed',
        webhookReceived: true,
        webhookData: data,
        updatedAt: new Date(),
      },
      create: {
        userId: userId || 'unknown',
        accountId: accountId || null,
        provider: 'RELOADLY',
        providerTransactionId: data.transactionId?.toString() || `reloadly-gc-${data.transactionId}`,
        type: 'GIFT_CARD',
        status: 'FAILED',
        amount: data.amount || 0,
        currency: data.currencyCode || 'USD',
        errorMessage: data.errorMessage || 'Gift card order failed',
        metadata: data,
        webhookReceived: true,
        webhookData: data,
      },
    });

    // TODO: Refund user if payment was deducted
  } catch (error) {
    console.error('Error updating failed gift card transaction:', error);
  }
  
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
  
  try {
    const customId = data.customIdentifier;
    const [, userId, accountId] = customId?.split('-') || [];

    await prisma.externalTransaction.upsert({
      where: {
        providerTransactionId: data.transactionId?.toString() || `reloadly-bill-${data.transactionId}`,
      },
      update: {
        status: 'COMPLETED',
        webhookReceived: true,
        webhookData: data,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: userId || 'unknown',
        accountId: accountId || null,
        provider: 'RELOADLY',
        providerTransactionId: data.transactionId?.toString() || `reloadly-bill-${data.transactionId}`,
        type: 'BILL_PAYMENT',
        status: 'COMPLETED',
        amount: data.amount || 0,
        currency: data.currencyCode || 'USD',
        recipientDetails: {
          billerName: data.billerName,
          accountNumber: data.subscriberAccountNumber,
        },
        metadata: data,
        webhookReceived: true,
        webhookData: data,
        completedAt: new Date(),
      },
    });

    // TODO: Store payment receipt
  } catch (error) {
    console.error('Error updating bill payment transaction:', error);
  }
  
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
  
  try {
    const customId = data.customIdentifier;
    const [, userId, accountId] = customId?.split('-') || [];

    await prisma.externalTransaction.upsert({
      where: {
        providerTransactionId: data.transactionId?.toString() || `reloadly-bill-${data.transactionId}`,
      },
      update: {
        status: 'FAILED',
        errorMessage: data.errorMessage || 'Bill payment failed',
        webhookReceived: true,
        webhookData: data,
        updatedAt: new Date(),
      },
      create: {
        userId: userId || 'unknown',
        accountId: accountId || null,
        provider: 'RELOADLY',
        providerTransactionId: data.transactionId?.toString() || `reloadly-bill-${data.transactionId}`,
        type: 'BILL_PAYMENT',
        status: 'FAILED',
        amount: data.amount || 0,
        currency: data.currencyCode || 'USD',
        errorMessage: data.errorMessage || 'Bill payment failed',
        metadata: data,
        webhookReceived: true,
        webhookData: data,
      },
    });

    // TODO: Refund user if payment was deducted
  } catch (error) {
    console.error('Error updating failed bill payment:', error);
  }
  
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
