/**
 * Rapyd Webhook Handler
 * 
 * Handles webhook events from Rapyd API
 * Events: PAYMENT_COMPLETED, PAYMENT_FAILED, PAYOUT_COMPLETED, PAYOUT_FAILED, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';
import { ENV_VARIABLES } from '@/config/integration-partners';

/**
 * Verify Rapyd webhook signature
 * Rapyd uses HMAC-SHA256 with salt, timestamp, and body
 * Includes timestamp validation to prevent replay attacks
 */
function verifyRapydSignature(
  body: string,
  signature: string | null,
  salt: string | null,
  timestamp: string | null
): boolean {
  if (!signature || !salt || !timestamp || !ENV_VARIABLES.RAPYD_SECRET_KEY) {
    console.error('[Rapyd Webhook] Missing required signature components');
    return false;
  }

  try {
    // Validate timestamp to prevent replay attacks (5 minute window)
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) {
      console.error('[Rapyd Webhook] Invalid timestamp format');
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const timestampAge = Math.abs(now - timestampNum);
    const MAX_TIMESTAMP_AGE = 300; // 5 minutes

    if (timestampAge > MAX_TIMESTAMP_AGE) {
      console.error(`[Rapyd Webhook] Timestamp too old: ${timestampAge}s ago (max: ${MAX_TIMESTAMP_AGE}s)`);
      return false;
    }

    // Validate salt format (should be alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(salt)) {
      console.error('[Rapyd Webhook] Invalid salt format');
      return false;
    }

    // Rapyd signature format: HMAC-SHA256(salt + timestamp + body)
    const toSign = `${salt}${timestamp}${body}`;
    const expectedSignature = createHmac('sha256', ENV_VARIABLES.RAPYD_SECRET_KEY)
      .update(toSign)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    if (result !== 0) {
      console.error('[Rapyd Webhook] Signature mismatch');
    }
    
    return result === 0;
  } catch (error) {
    console.error('[Rapyd Webhook] Signature verification error:', error);
    return false;
  }
}

/**
 * Handle payment completed event
 */
async function handlePaymentCompleted(data: any) {
  try {
    const paymentId = data.id || data.payment_id;
    const status = data.status || 'COMPLETED';
    const amount = data.amount || data.original_amount;
    const currency = data.currency_code || data.currency;
    const metadata = data.metadata || {};

    console.log(`[Rapyd Webhook] Payment completed: ${paymentId}`);

    // Check if this is an invoice payment
    if (metadata.invoiceId || metadata.type === 'invoice_payment') {
      const invoiceId = metadata.invoiceId;
      
      if (invoiceId) {
        try {
          // Try to find invoice by ID or invoice number
          const invoice = await prisma.invoice.findFirst({
            where: {
              OR: [
                { id: invoiceId },
                { invoiceNumber: invoiceId },
              ],
            },
          });

          if (invoice && invoice.status !== 'PAID') {
            // Update invoice status to PAID
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                status: 'PAID',
                paidAt: new Date(),
              },
            });

            console.log(`[Rapyd Webhook] Updated invoice ${invoice.id} (${invoice.invoiceNumber}) to PAID`);

            // Also update Firestore if invoice exists there
            try {
              const { doc, updateDoc } = await import('firebase/firestore');
              const { db } = await import('@/lib/firebase');
              
              // Try invoices collection
              const invoiceRef = doc(db, 'invoices', invoiceId);
              try {
                await updateDoc(invoiceRef, {
                  status: 'Paid',
                  paidAt: new Date(),
                });
                console.log(`[Rapyd Webhook] Updated Firestore invoice ${invoiceId} to Paid`);
              } catch (firestoreError: any) {
                // Try businessInvoices collection
                if (firestoreError.code === 'not-found') {
                  const businessInvoiceRef = doc(db, 'businessInvoices', invoiceId);
                  try {
                    await updateDoc(businessInvoiceRef, {
                      status: 'Paid',
                      paidAt: new Date(),
                    });
                    console.log(`[Rapyd Webhook] Updated Firestore business invoice ${invoiceId} to Paid`);
                  } catch (businessError) {
                    console.warn(`[Rapyd Webhook] Invoice ${invoiceId} not found in Firestore`);
                  }
                }
              }
            } catch (firestoreError) {
              console.warn('[Rapyd Webhook] Could not update Firestore invoice:', firestoreError);
            }
          } else if (invoice) {
            console.log(`[Rapyd Webhook] Invoice ${invoice.id} already marked as PAID`);
          } else {
            console.warn(`[Rapyd Webhook] Invoice ${invoiceId} not found in database`);
          }
        } catch (invoiceError) {
          console.error('[Rapyd Webhook] Error updating invoice:', invoiceError);
        }
      }
    }

    // Find transaction by provider transaction ID
    const transaction = await prisma.externalTransaction.findFirst({
      where: {
        provider: 'RAPYD',
        providerTransactionId: paymentId,
      },
    });

    if (transaction) {
      // Update transaction status
      await prisma.externalTransaction.update({
        where: { id: transaction.id },
        data: {
          status: status === 'CLO' || status === 'ACT' ? 'COMPLETED' : transaction.status,
          webhookReceived: true,
          webhookData: data,
          completedAt: status === 'CLO' || status === 'ACT' ? new Date() : transaction.completedAt,
        },
      });

      console.log(`[Rapyd Webhook] Updated transaction ${transaction.id} to COMPLETED`);
    } else {
      console.warn(`[Rapyd Webhook] Payment ${paymentId} not found in database`);
    }
  } catch (error) {
    console.error('[Rapyd Webhook] Error handling payment completed:', error);
    throw error;
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(data: any) {
  try {
    const paymentId = data.id || data.payment_id;
    const errorMessage = data.failure_message || data.error?.message || 'Payment failed';

    console.log(`[Rapyd Webhook] Payment failed: ${paymentId}`);

    const transaction = await prisma.externalTransaction.findFirst({
      where: {
        provider: 'RAPYD',
        providerTransactionId: paymentId,
      },
    });

    if (transaction) {
      await prisma.externalTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          errorMessage,
          webhookReceived: true,
          webhookData: data,
        },
      });

      console.log(`[Rapyd Webhook] Updated transaction ${transaction.id} to FAILED`);
    }
  } catch (error) {
    console.error('[Rapyd Webhook] Error handling payment failed:', error);
    throw error;
  }
}

/**
 * Handle payout completed event
 */
async function handlePayoutCompleted(data: any) {
  try {
    const payoutId = data.id || data.payout_id;
    const status = data.status || 'COMPLETED';

    console.log(`[Rapyd Webhook] Payout completed: ${payoutId}`);

    const transaction = await prisma.externalTransaction.findFirst({
      where: {
        provider: 'RAPYD',
        providerTransactionId: payoutId,
        type: 'PAYOUT',
      },
    });

    if (transaction) {
      await prisma.externalTransaction.update({
        where: { id: transaction.id },
        data: {
          status: status === 'CLO' || status === 'ACT' ? 'COMPLETED' : transaction.status,
          webhookReceived: true,
          webhookData: data,
          completedAt: status === 'CLO' || status === 'ACT' ? new Date() : transaction.completedAt,
        },
      });
    }
  } catch (error) {
    console.error('[Rapyd Webhook] Error handling payout completed:', error);
    throw error;
  }
}

/**
 * Handle payout failed event
 */
async function handlePayoutFailed(data: any) {
  try {
    const payoutId = data.id || data.payout_id;
    const errorMessage = data.error?.message || data.error_code || 'Payout failed';

    console.log(`[Rapyd Webhook] Payout failed: ${payoutId}`);

    const transaction = await prisma.externalTransaction.findFirst({
      where: {
        provider: 'RAPYD',
        providerTransactionId: payoutId,
        type: 'PAYOUT',
      },
    });

    if (transaction) {
      await prisma.externalTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          errorMessage,
          webhookReceived: true,
          webhookData: data,
        },
      });
    }
  } catch (error) {
    console.error('[Rapyd Webhook] Error handling payout failed:', error);
    throw error;
  }
}

/**
 * Handle virtual account deposit event
 */
async function handleVirtualAccountDeposit(data: any) {
  try {
    const transactionId = data.id || data.transaction_id;
    const virtualAccountId = data.virtual_account_id;

    console.log(`[Rapyd Webhook] Virtual account deposit: ${transactionId}`);

    // Create or update transaction record
    const transaction = await prisma.externalTransaction.findFirst({
      where: {
        provider: 'RAPYD',
        providerTransactionId: transactionId,
        type: 'VIRTUAL_ACCOUNT_DEPOSIT',
      },
    });

    if (transaction) {
      const previousStatus = transaction.status;
      
      await prisma.externalTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          webhookReceived: true,
          webhookData: data,
          completedAt: new Date(),
        },
      });

      // Send notification for completed deposit
      if (previousStatus !== 'COMPLETED') {
        try {
          const { notifyDeposit, notifyLargeDeposit } = await import('@/lib/unified-notifications');
          const amount = parseFloat(transaction.amount.toString());
          const currency = transaction.currency;
          
          await notifyDeposit(transaction.userId, amount, currency, 'Virtual Account Deposit');
          
          // Check for large deposit (threshold: 1000)
          if (amount >= 1000) {
            await notifyLargeDeposit(transaction.userId, amount, currency, 1000);
          }
        } catch (notifError) {
          console.error('Error sending deposit notification:', notifError);
          // Don't fail webhook if notification fails
        }
      }
    }
  } catch (error) {
    console.error('[Rapyd Webhook] Error handling virtual account deposit:', error);
    throw error;
  }
}

/**
 * POST /api/webhooks/rapyd
 * 
 * Handle Rapyd webhook events
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Rapyd Webhook] Received webhook request');

    // Get raw body for signature verification
    const body = await request.text();
    
    // Get signature headers
    const signature = request.headers.get('signature');
    const salt = request.headers.get('salt');
    const timestamp = request.headers.get('timestamp');

    // Verify signature
    if (!verifyRapydSignature(body, signature, salt, timestamp)) {
      console.error('[Rapyd Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse event data
    const event = JSON.parse(body);
    const eventType = event.type || event.event_type;

    console.log(`[Rapyd Webhook] Processing event: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case 'PAYMENT_COMPLETED':
      case 'PAYMENT_SUCCESS':
        await handlePaymentCompleted(event.data || event);
        break;

      case 'PAYMENT_FAILED':
      case 'PAYMENT_ERROR':
        await handlePaymentFailed(event.data || event);
        break;

      case 'PAYOUT_COMPLETED':
      case 'PAYOUT_SUCCESS':
        await handlePayoutCompleted(event.data || event);
        break;

      case 'PAYOUT_FAILED':
      case 'PAYOUT_ERROR':
        await handlePayoutFailed(event.data || event);
        break;

      case 'CREATED_VIRTUAL_ACCOUNT_TRANSACTION':
      case 'VIRTUAL_ACCOUNT_DEPOSIT':
        await handleVirtualAccountDeposit(event.data || event);
        break;

      case 'TRANSFER_COMPLETED':
        // Handle wallet transfer if needed
        console.log('[Rapyd Webhook] Transfer completed:', event.data || event);
        break;

      default:
        console.log(`[Rapyd Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true, eventType });
  } catch (error: any) {
    console.error('[Rapyd Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/rapyd
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Rapyd webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

