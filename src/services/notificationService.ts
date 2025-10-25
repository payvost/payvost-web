import * as OneSignal from '@onesignal/node-onesignal';

// --- OneSignal Client Initialization ---
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || '';

// Initialize OneSignal client
const configuration = OneSignal.createConfiguration({
  appKey: ONESIGNAL_API_KEY,
});

const client = new OneSignal.DefaultApi(configuration);

// --- Notification Templates ---
const EMAIL_TEMPLATES = {
  AUTH: {
    LOGIN: 'template_id_for_login',
    SIGNUP: 'template_id_for_signup',
    PASSWORD_RESET: 'template_id_for_password_reset',
    NEW_DEVICE: 'template_id_for_new_device',
  },
  KYC: {
    SUBMISSION_RECEIVED: 'template_id_for_kyc_submission',
    APPROVED: '541ae0b3-f36e-4788-8e12-de07a6a714a6', // <- Update this line
    REJECTED: 'template_id_for_kyc_rejected',
  },
  BUSINESS: {
    SUBMISSION_RECEIVED: 'template_id_for_business_submission',
    APPROVED: 'template_id_for_business_approved',
    REJECTED: 'template_id_for_business_rejected',
  },
  TRANSACTION: {
    INITIATED: 'template_id_for_transaction_initiated',
    SUCCESS: 'template_id_for_transaction_success',
    FAILED: 'template_id_for_transaction_failed',
    STATUS_UPDATE: 'template_id_for_transaction_status',
    REFUND_INITIATED: 'template_id_for_refund_initiated',
    REFUND_COMPLETED: 'template_id_for_refund_completed',
  },
  PAYMENT: {
    LINK_GENERATED: 'template_id_for_payment_link',
    PAYMENT_RECEIVED: 'template_id_for_payment_received',
  },
  INVOICE: {
    GENERATED: 'template_id_for_invoice_generated',
    REMINDER: 'template_id_for_invoice_reminder',
    PAID: 'template_id_for_invoice_paid',
  },
};

// --- Base Notification Interface ---
interface NotificationBase {
  email: string;
  name: string;
  language?: string;
}

// --- Notification Type Interfaces ---
interface AuthNotification extends NotificationBase {
  deviceInfo?: string;
  location?: string;
  timestamp: Date;
}

interface KycNotification extends NotificationBase {
  status: 'approved' | 'rejected';
  reason?: string;
  nextSteps?: string;
}

interface BusinessNotification extends NotificationBase {
  status: 'approved' | 'rejected';
  businessName: string;
  reason?: string;
  nextSteps?: string;
}

interface TransactionNotification extends NotificationBase {
  transactionId: string;
  amount: number;
  currency: string;
  status: 'initiated' | 'success' | 'failed' | 'refunded';
  recipientName?: string;
  reason?: string;
}

interface PaymentLinkNotification extends NotificationBase {
  amount: number;
  currency: string;
  paymentLink: string;
  expiryDate?: Date;
  description?: string;
}

interface InvoiceNotification extends NotificationBase {
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  businessName: string;
  downloadLink?: string;
}

// --- Notification Functions ---

// Authentication Notifications
export async function sendLoginNotification(data: AuthNotification) {
  const notification: OneSignal.Notification = {
    app_id: ONESIGNAL_APP_ID,
    include_email_tokens: [data.email],
    template_id: EMAIL_TEMPLATES.AUTH.LOGIN,
    name: "Login Notification",
    email_subject: "New Login Detected",
    email_from_name: "Payvost Security",
    email_from_address: "noreply@payvost.com",
    data: {
      name: data.name,
      deviceInfo: data.deviceInfo,
      location: data.location,
      timestamp: data.timestamp.toISOString(),
    }
  };

  try {
    const response = await client.createNotification(notification);
    console.log('✅ Login notification sent:', response.id);
    return { success: true, id: response.id };
  } catch (error: any) {
    console.error('❌ Failed to send login notification:', error.body || error);
    throw new Error('Failed to send login notification');
  }
}

// KYC Notifications
export async function sendKycStatusNotification(data: KycNotification) {
  const notification: OneSignal.Notification = {
    app_id: ONESIGNAL_APP_ID,
    include_email_tokens: [data.email],
    template_id: data.status === 'approved' ? 
      EMAIL_TEMPLATES.KYC.APPROVED : 
      EMAIL_TEMPLATES.KYC.REJECTED,
    name: "KYC Status Update",
    email_subject: `KYC Verification ${data.status === 'approved' ? 'Approved' : 'Requires Action'}`,
    email_from_name: "Payvost Compliance",
    email_from_address: "noreply@payvost.com",
    data: {
      name: data.name,
      status: data.status,
      reason: data.reason,
      nextSteps: data.nextSteps,
    }
  };

  try {
    const response = await client.createNotification(notification);
    console.log('✅ KYC status notification sent:', response.id);
    return { success: true, id: response.id };
  } catch (error: any) {
    console.error('❌ Failed to send KYC status notification:', error.body || error);
    throw new Error('Failed to send KYC status notification');
  }
}

// Business Notifications
export async function sendBusinessStatusNotification(data: BusinessNotification) {
  const notification: OneSignal.Notification = {
    app_id: ONESIGNAL_APP_ID,
    include_email_tokens: [data.email],
    template_id: data.status === 'approved' ? 
      EMAIL_TEMPLATES.BUSINESS.APPROVED : 
      EMAIL_TEMPLATES.BUSINESS.REJECTED,
    name: "Business Status Update",
    email_subject: `Business Account ${data.status === 'approved' ? 'Approved' : 'Requires Action'}`,
    email_from_name: "Payvost Business",
    email_from_address: "noreply@payvost.com",
    data: {
      name: data.name,
      businessName: data.businessName,
      status: data.status,
      reason: data.reason,
      nextSteps: data.nextSteps,
    }
  };

  try {
    const response = await client.createNotification(notification);
    console.log('✅ Business status notification sent:', response.id);
    return { success: true, id: response.id };
  } catch (error: any) {
    console.error('❌ Failed to send business status notification:', error.body || error);
    throw new Error('Failed to send business status notification');
  }
}

// Transaction Notifications
export async function sendTransactionNotification(data: TransactionNotification) {
  const templateKey = data.status.toUpperCase() as keyof typeof EMAIL_TEMPLATES.TRANSACTION;
  const notification: OneSignal.Notification = {
    app_id: ONESIGNAL_APP_ID,
    include_email_tokens: [data.email],
    template_id: EMAIL_TEMPLATES.TRANSACTION[templateKey],
    name: "Transaction Update",
    email_subject: `Transaction ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`,
    email_from_name: "Payvost Transactions",
    email_from_address: "noreply@payvost.com",
    data: {
      name: data.name,
      transactionId: data.transactionId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      recipientName: data.recipientName,
      reason: data.reason,
    }
  };

  try {
    const response = await client.createNotification(notification);
    console.log('✅ Transaction notification sent:', response.id);
    return { success: true, id: response.id };
  } catch (error: any) {
    console.error('❌ Failed to send transaction notification:', error.body || error);
    throw new Error('Failed to send transaction notification');
  }
}

// Payment Link Notifications
export async function sendPaymentLinkNotification(data: PaymentLinkNotification) {
  const notification: OneSignal.Notification = {
    app_id: ONESIGNAL_APP_ID,
    include_email_tokens: [data.email],
    template_id: EMAIL_TEMPLATES.PAYMENT.LINK_GENERATED,
    name: "Payment Link Generated",
    email_subject: "New Payment Link",
    email_from_name: "Payvost Payments",
    email_from_address: "noreply@payvost.com",
    data: {
      name: data.name,
      amount: data.amount,
      currency: data.currency,
      paymentLink: data.paymentLink,
      expiryDate: data.expiryDate?.toISOString(),
      description: data.description,
    }
  };

  try {
    const response = await client.createNotification(notification);
    console.log('✅ Payment link notification sent:', response.id);
    return { success: true, id: response.id };
  } catch (error: any) {
    console.error('❌ Failed to send payment link notification:', error.body || error);
    throw new Error('Failed to send payment link notification');
  }
}

// Invoice Notifications
export async function sendInvoiceNotification(data: InvoiceNotification, type: 'generated' | 'reminder' | 'paid') {
  const templateKey = type.toUpperCase() as keyof typeof EMAIL_TEMPLATES.INVOICE;
  const notification: OneSignal.Notification = {
    app_id: ONESIGNAL_APP_ID,
    include_email_tokens: [data.email],
    template_id: EMAIL_TEMPLATES.INVOICE[templateKey],
    name: "Invoice Notification",
    email_subject: `Invoice ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    email_from_name: "Payvost Invoicing",
    email_from_address: "noreply@payvost.com",
    data: {
      name: data.name,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      currency: data.currency,
      dueDate: data.dueDate.toISOString(),
      businessName: data.businessName,
      downloadLink: data.downloadLink,
    }
  };

  try {
    const response = await client.createNotification(notification);
    console.log('✅ Invoice notification sent:', response.id);
    return { success: true, id: response.id };
  } catch (error: any) {
    console.error('❌ Failed to send invoice notification:', error.body || error);
    throw new Error('Failed to send invoice notification');
  }
}