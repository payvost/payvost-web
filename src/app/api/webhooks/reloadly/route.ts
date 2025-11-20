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
import { db, auth } from '@/lib/firebase-admin';
import { buildBackendUrl } from '@/lib/api/backend';

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
 * Fetch user data from Firebase
 */
async function getUserData(userId: string): Promise<{ email: string; name: string } | null> {
  try {
    // Try to get from Firestore first
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return {
        email: userData?.email || '',
        name: userData?.fullName || userData?.name || userData?.username || 'User',
      };
    }

    // Fallback to Firebase Auth
    const authUser = await auth.getUser(userId);
    return {
      email: authUser.email || '',
      name: authUser.displayName || 'User',
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Refund balance to user account
 */
async function refundToAccount(accountId: string | null, amount: number, currency: string, description: string, referenceId?: string): Promise<void> {
  if (!accountId) {
    console.warn('No accountId provided for refund');
    return;
  }

  try {
    // Call backend refund API (we need to use a system token or make this a server-side call)
    // For now, we'll use fetch with a service account token or make it a direct Prisma call
    // Since this is a webhook, we'll use Prisma directly to update the account
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      console.error(`Account ${accountId} not found for refund`);
      return;
    }

    if (account.currency !== currency) {
      console.error(`Currency mismatch: account has ${account.currency}, refund is ${currency}`);
      return;
    }

    // Update balance and create ledger entry in a transaction
    await prisma.$transaction(async (tx) => {
      // Lock account
      const lockedAccount = await tx.$queryRaw<Array<{ id: string; balance: string }>>`
        SELECT id, balance
        FROM "Account"
        WHERE id = ${accountId}
        FOR UPDATE
      `;

      const accountData = lockedAccount[0];
      if (!accountData) {
        throw new Error('Account not found');
      }

      const currentBalance = parseFloat(accountData.balance);
      const refundAmount = parseFloat(amount.toString());
      const newBalance = (currentBalance + refundAmount).toFixed(8);

      // Update account balance
      await tx.account.update({
        where: { id: accountId },
        data: { balance: newBalance },
      });

      // Create ledger entry
      await tx.ledgerEntry.create({
        data: {
          accountId,
          amount: refundAmount.toString(),
          balanceAfter: newBalance,
          type: 'CREDIT',
          description: description,
          referenceId: referenceId || null,
        },
      });
    });

    console.log(`Refunded ${amount} ${currency} to account ${accountId}`);
  } catch (error) {
    console.error('Error refunding balance:', error);
    throw error;
  }
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
        // Fetch user details from Firebase
        const userData = await getUserData(userId);
        if (userData) {
          await notificationService.notifyExternalTransaction({
            userId,
            userEmail: userData.email,
            userName: userData.name,
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
        }
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
    const transactionRecord = await prisma.externalTransaction.upsert({
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
    if (accountId && data.amount) {
      try {
        await refundToAccount(
          accountId,
          data.amount,
          data.currency || 'USD',
          `Refund for failed airtime top-up`,
          transactionRecord.id
        );
      } catch (refundError) {
        console.error('Failed to refund balance:', refundError);
        // Log for manual review but don't fail the webhook
      }
    }
    
    // Send notification to user about failed transaction
    if (userId && userId !== 'unknown') {
      try {
        const userData = await getUserData(userId);
        if (userData) {
          await notificationService.sendEmail({
            to: userData.email,
            subject: 'Airtime Top-up Failed',
            template: 'transaction_failed',
            variables: {
              name: userData.name,
              reason: data.errorMessage || data.failureReason || 'Topup failed',
              amount: data.amount,
              currency: data.currency || 'USD',
              date: new Date().toLocaleString(),
            },
          });
        }
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
    const transaction = await prisma.externalTransaction.upsert({
      where: {
        providerTransactionId: data.transactionId?.toString() || `reloadly-gc-${data.transactionId}`,
      },
      update: {
        status: 'COMPLETED',
        webhookReceived: true,
        webhookData: data,
        completedAt: new Date(),
        updatedAt: new Date(),
        // Store redeem codes in recipientDetails
        recipientDetails: {
          email: data.recipientEmail,
          productName: data.productName,
          redeemCode: data.redeemCode || data.redemptionCode || data.code,
          pin: data.pin || data.pinCode,
          expiryDate: data.expiryDate,
          cardNumber: data.cardNumber,
        },
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
          redeemCode: data.redeemCode || data.redemptionCode || data.code,
          pin: data.pin || data.pinCode,
          expiryDate: data.expiryDate,
          cardNumber: data.cardNumber,
        },
        metadata: data,
        webhookReceived: true,
        webhookData: data,
        completedAt: new Date(),
      },
    });

    // Send gift card details to recipient if email is provided
    if (data.recipientEmail && (data.redeemCode || data.redemptionCode || data.code)) {
      try {
        const userData = userId && userId !== 'unknown' ? await getUserData(userId) : null;
        await notificationService.sendEmail({
          to: data.recipientEmail,
          subject: 'Your Gift Card is Ready!',
          template: 'gift_card_delivery',
          variables: {
            recipientName: data.recipientName || 'Valued Customer',
            productName: data.productName,
            amount: data.amount,
            currency: data.currencyCode || 'USD',
            redeemCode: data.redeemCode || data.redemptionCode || data.code,
            pin: data.pin || data.pinCode || 'N/A',
            expiryDate: data.expiryDate || 'N/A',
            senderName: userData?.name || 'Payvost',
          },
        });
      } catch (emailError) {
        console.error('Failed to send gift card email:', emailError);
      }
    }
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

    const transactionRecord = await prisma.externalTransaction.upsert({
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

    // Refund user if payment was deducted
    if (accountId && data.amount) {
      try {
        await refundToAccount(
          accountId,
          data.amount,
          data.currencyCode || 'USD',
          `Refund for failed gift card order`,
          transactionRecord.id
        );
      } catch (refundError) {
        console.error('Failed to refund balance:', refundError);
      }
    }
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
        // Store payment receipt in recipientDetails
        recipientDetails: {
          billerName: data.billerName,
          accountNumber: data.subscriberAccountNumber,
          receiptNumber: data.receiptNumber || data.receipt || data.transactionId?.toString(),
          receiptUrl: data.receiptUrl || data.receiptLink,
          confirmationCode: data.confirmationCode || data.confirmationNumber,
          paymentDate: data.paymentDate || new Date().toISOString(),
        },
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
          receiptNumber: data.receiptNumber || data.receipt || data.transactionId?.toString(),
          receiptUrl: data.receiptUrl || data.receiptLink,
          confirmationCode: data.confirmationCode || data.confirmationNumber,
          paymentDate: data.paymentDate || new Date().toISOString(),
        },
        metadata: data,
        webhookReceived: true,
        webhookData: data,
        completedAt: new Date(),
      },
    });
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

    // Refund user if payment was deducted
    if (accountId && data.amount) {
      try {
        await refundToAccount(
          accountId,
          data.amount,
          data.currencyCode || 'USD',
          `Refund for failed bill payment`,
          transactionRecord?.id || undefined
        );
      } catch (refundError) {
        console.error('Failed to refund balance:', refundError);
      }
    }
  } catch (error) {
    console.error('Error updating failed bill payment:', error);
    // Log error for investigation
    console.error('Failed bill payment details:', {
      transactionId: data.transactionId,
      userId,
      accountId,
      amount: data.amount,
      currency: data.currencyCode,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
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
