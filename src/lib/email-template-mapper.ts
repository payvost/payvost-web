/**
 * Email Template Mapper
 * Maps frontend template ids (underscore) to Mailgun stored template names.
 *
 * Note: For payvost.com the Mailgun templates are currently human-readable names with spaces
 * (e.g. "login notification template"), not the hyphenated ids.
 */

import type { EmailTemplate } from '@/services/notificationService';

/**
 * Maps frontend template names to Mailgun template names
 * Frontend uses underscores (e.g., 'login_alert')
 * Mailgun uses stored template names (e.g., 'login notification template')
 */
export function mapToMailgunTemplate(frontendTemplate: EmailTemplate): string {
  const templateMap: Record<EmailTemplate, string> = {
    // Transaction templates
    transaction_success: 'transaction success template',
    transaction_failed: 'transaction_failed', // missing in Mailgun: create "transaction failed template" if needed
    
    // Bill payment templates
    bill_payment_success: 'bill-payment-success',
    bill_payment_failed: 'bill-payment-failed',
    
    // Gift card and airtime
    gift_card_delivered: 'gift-card-delivered',
    airtime_topup_success: 'airtime-topup-success',
    
    // KYC templates
    kyc_verified: 'kyc approved template',
    kyc_rejected: 'kyc_rejected', // missing in Mailgun: create "kyc rejected template" if needed
    
    // Account templates
    account_welcome: 'account-welcome',
    password_reset: 'password-reset',
    login_alert: 'login notification template',
    
    // Transaction types
    withdrawal_request: 'withdrawal-request',
    deposit_received: 'deposit-received',
    
    // Invoice templates
    invoice_generated: 'invoice generated template',
    invoice_reminder: 'invoice reminder template',
    invoice_paid: 'invoice_paid', // missing in Mailgun: create "invoice paid template" if needed
  };

  return templateMap[frontendTemplate] || frontendTemplate;
}

/**
 * Maps Mailgun template names back to frontend template names
 */
export function mapFromMailgunTemplate(mailgunTemplate: string): EmailTemplate | null {
  const reverseMap: Record<string, EmailTemplate> = {
    'transaction success template': 'transaction_success',
    'bill-payment-success': 'bill_payment_success',
    'bill-payment-failed': 'bill_payment_failed',
    'gift-card-delivered': 'gift_card_delivered',
    'airtime-topup-success': 'airtime_topup_success',
    'kyc approved template': 'kyc_verified',
    'account-welcome': 'account_welcome',
    'password-reset': 'password_reset',
    'login notification template': 'login_alert',
    'withdrawal-request': 'withdrawal_request',
    'deposit-received': 'deposit_received',
    'invoice generated template': 'invoice_generated',
    'invoice reminder template': 'invoice_reminder',
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

