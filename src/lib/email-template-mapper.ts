/**
 * Email Template Mapper
 * Maps frontend template names (underscore) to Mailgun template names (hyphen)
 * This allows the unified notification system to work with both frontend templates
 * and backend Mailgun templates seamlessly.
 */

import type { EmailTemplate } from '@/services/notificationService';

/**
 * Maps frontend template names to Mailgun template names
 * Frontend uses underscores (e.g., 'login_alert')
 * Mailgun uses hyphens (e.g., 'login-notification')
 */
export function mapToMailgunTemplate(frontendTemplate: EmailTemplate): string {
  const templateMap: Record<EmailTemplate, string> = {
    // Transaction templates
    transaction_success: 'transaction-success',
    transaction_failed: 'transaction-failed',
    
    // Bill payment templates
    bill_payment_success: 'bill-payment-success',
    bill_payment_failed: 'bill-payment-failed',
    
    // Gift card and airtime
    gift_card_delivered: 'gift-card-delivered',
    airtime_topup_success: 'airtime-topup-success',
    
    // KYC templates
    kyc_verified: 'kyc-approved',
    kyc_rejected: 'kyc-rejected',
    
    // Account templates
    account_welcome: 'account-welcome',
    password_reset: 'password-reset',
    login_alert: 'login-notification',
    
    // Transaction types
    withdrawal_request: 'withdrawal-request',
    deposit_received: 'deposit-received',
    
    // Invoice templates
    invoice_generated: 'invoice-generated',
    invoice_reminder: 'invoice-reminder',
    invoice_paid: 'invoice-paid',
  };

  return templateMap[frontendTemplate] || frontendTemplate;
}

/**
 * Maps Mailgun template names back to frontend template names
 */
export function mapFromMailgunTemplate(mailgunTemplate: string): EmailTemplate | null {
  const reverseMap: Record<string, EmailTemplate> = {
    'transaction-success': 'transaction_success',
    'transaction-failed': 'transaction_failed',
    'bill-payment-success': 'bill_payment_success',
    'bill-payment-failed': 'bill_payment_failed',
    'gift-card-delivered': 'gift_card_delivered',
    'airtime-topup-success': 'airtime_topup_success',
    'kyc-approved': 'kyc_verified',
    'kyc-rejected': 'kyc_rejected',
    'account-welcome': 'account_welcome',
    'password-reset': 'password_reset',
    'login-notification': 'login_alert',
    'withdrawal-request': 'withdrawal_request',
    'deposit-received': 'deposit_received',
    'invoice-generated': 'invoice_generated',
    'invoice-reminder': 'invoice_reminder',
    'invoice-paid': 'invoice_paid',
  };

  return reverseMap[mailgunTemplate] || null;
}

/**
 * Get all valid frontend template names
 */
export function getAllValidTemplates(): EmailTemplate[] {
  return [
    'transaction_success',
    'transaction_failed',
    'bill_payment_success',
    'bill_payment_failed',
    'gift_card_delivered',
    'airtime_topup_success',
    'kyc_verified',
    'kyc_rejected',
    'account_welcome',
    'password_reset',
    'login_alert',
    'withdrawal_request',
    'deposit_received',
    'invoice_generated',
    'invoice_reminder',
    'invoice_paid',
  ];
}

/**
 * Check if a template name is valid
 */
export function isValidTemplate(template: string): template is EmailTemplate {
  return getAllValidTemplates().includes(template as EmailTemplate);
}

