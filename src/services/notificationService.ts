/**
 * Notification Service
 * Handles email notifications via Mailgun API and SMS via Twilio
 */

import { sendEmail, isMailgunConfigured } from '@/lib/mailgun';

// Email notification types
export interface EmailNotification {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  variables: Record<string, any>;
  from?: string;
}

export type EmailTemplate = 
  | 'transaction_success'
  | 'transaction_failed'
  | 'bill_payment_success'
  | 'bill_payment_failed'
  | 'gift_card_delivered'
  | 'airtime_topup_success'
  | 'kyc_verified'
  | 'kyc_rejected'
  | 'account_welcome'
  | 'password_reset'
  | 'login_alert'
  | 'withdrawal_request'
  | 'deposit_received'
  | 'invoice_generated'
  | 'invoice_reminder'
  | 'invoice_paid';

// SMS notification interface
export interface SMSNotification {
  to: string;
  message: string;
}

class NotificationService {
  private emailConfigured: boolean = false;
  private twilioConfigured: boolean = false;

  constructor() {
    this.checkEmailConfig();
    this.checkTwilioConfig();
  }

  /**
   * Check if Mailgun API is configured
   */
  private checkEmailConfig() {
    this.emailConfigured = isMailgunConfigured();
    if (!this.emailConfigured) {
      console.warn('Mailgun API not configured. Email notifications will be disabled.');
    } else {
      console.log('Mailgun API configured successfully');
    }
  }

  /**
   * Check if Twilio is configured
   */
  private checkTwilioConfig() {
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    this.twilioConfigured = !!(twilioAccountSid && twilioAuthToken && twilioPhoneNumber);

    if (!this.twilioConfigured) {
      console.warn('Twilio credentials not configured. SMS notifications will be disabled.');
    }
  }

  /**
   * Get email template HTML
   */
  private getEmailTemplate(template: EmailTemplate, variables: Record<string, any>): string {
    const templates: Record<EmailTemplate, (vars: Record<string, any>) => string> = {
      transaction_success: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Transaction Successful ✓</h2>
          <p>Hello ${vars.name},</p>
          <p>Your transaction has been completed successfully.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${vars.currency} ${vars.amount}</p>
            <p><strong>Recipient:</strong> ${vars.recipient}</p>
            <p><strong>Date:</strong> ${vars.date}</p>
            <p><strong>Transaction ID:</strong> ${vars.transactionId}</p>
          </div>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      transaction_failed: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Transaction Failed ✗</h2>
          <p>Hello ${vars.name},</p>
          <p>Unfortunately, your transaction could not be completed.</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p><strong>Reason:</strong> ${vars.reason}</p>
            <p><strong>Amount:</strong> ${vars.currency} ${vars.amount}</p>
            <p><strong>Date:</strong> ${vars.date}</p>
          </div>
          <p>Please try again or contact our support team for assistance.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      bill_payment_success: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Bill Payment Successful ✓</h2>
          <p>Hello ${vars.name},</p>
          <p>Your bill payment has been processed successfully.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Biller:</strong> ${vars.billerName}</p>
            <p><strong>Account Number:</strong> ${vars.accountNumber}</p>
            <p><strong>Amount:</strong> ${vars.currency} ${vars.amount}</p>
            <p><strong>Date:</strong> ${vars.date}</p>
            <p><strong>Reference:</strong> ${vars.reference}</p>
          </div>
          <p>Your payment will be reflected in your account within 24 hours.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      bill_payment_failed: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Bill Payment Failed ✗</h2>
          <p>Hello ${vars.name},</p>
          <p>Your bill payment could not be processed.</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p><strong>Biller:</strong> ${vars.billerName}</p>
            <p><strong>Reason:</strong> ${vars.reason}</p>
            <p><strong>Amount:</strong> ${vars.currency} ${vars.amount}</p>
          </div>
          <p>Please verify your account details and try again.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      gift_card_delivered: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Gift Card Delivered 🎁</h2>
          <p>Hello ${vars.name},</p>
          <p>Your gift card has been successfully delivered!</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Brand:</strong> ${vars.brandName}</p>
            <p><strong>Amount:</strong> ${vars.currency} ${vars.amount}</p>
            <p><strong>Code:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 4px;">${vars.code}</code></p>
            ${vars.pin ? `<p><strong>PIN:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 4px;">${vars.pin}</code></p>` : ''}
            <p><strong>Redemption URL:</strong> <a href="${vars.redemptionUrl}">${vars.redemptionUrl}</a></p>
          </div>
          <p>Please keep this information safe. The gift card code can only be used once.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      airtime_topup_success: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Airtime Top-up Successful ✓</h2>
          <p>Hello ${vars.name},</p>
          <p>Your airtime top-up has been completed successfully.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Phone Number:</strong> ${vars.phoneNumber}</p>
            <p><strong>Operator:</strong> ${vars.operatorName}</p>
            <p><strong>Amount:</strong> ${vars.currency} ${vars.amount}</p>
            <p><strong>Date:</strong> ${vars.date}</p>
          </div>
          <p>The airtime should be available on the recipient's phone immediately.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      kyc_verified: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Account Verified ✓</h2>
          <p>Hello ${vars.name},</p>
          <p>Congratulations! Your account has been successfully verified.</p>
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p>You now have full access to all Payvost features, including:</p>
            <ul>
              <li>Unlimited transactions</li>
              <li>Higher transaction limits</li>
              <li>Bill payments and gift cards</li>
              <li>International transfers</li>
            </ul>
          </div>
          <p>Start exploring your dashboard and enjoy seamless payments!</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      account_welcome: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Welcome to Payvost! 🎉</h2>
          <p>Hello ${vars.name},</p>
          <p>Thank you for joining Payvost. We're excited to have you on board!</p>
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p><strong>Next steps:</strong></p>
            <ol>
              <li>Complete your profile</li>
              <li>Verify your identity (KYC)</li>
              <li>Add your first wallet</li>
              <li>Start sending money</li>
            </ol>
          </div>
          <p>If you need help getting started, check out our <a href="${vars.helpUrl}">Help Center</a> or contact support.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      password_reset: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Password Reset Request</h2>
          <p>Hello ${vars.name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.resetUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      login_alert: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">New Login Detected</h2>
          <p>Hello ${vars.name},</p>
          <p>We detected a new login to your account.</p>
          <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p><strong>Device:</strong> ${vars.device}</p>
            <p><strong>Location:</strong> ${vars.location}</p>
            <p><strong>IP Address:</strong> ${vars.ipAddress}</p>
            <p><strong>Date:</strong> ${vars.date}</p>
          </div>
          <p>If this wasn't you, please secure your account immediately by changing your password.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      withdrawal_request: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Withdrawal Request Received</h2>
          <p>Hello ${vars.name},</p>
          <p>We have received your withdrawal request and it's being processed.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${vars.currency} ${vars.amount}</p>
            <p><strong>Bank:</strong> ${vars.bankName}</p>
            <p><strong>Account:</strong> ${vars.accountNumber}</p>
            <p><strong>Date:</strong> ${vars.date}</p>
          </div>
          <p>The funds will be credited to your account within 1-3 business days.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      deposit_received: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Deposit Received ✓</h2>
          <p>Hello ${vars.name},</p>
          <p>We have successfully received your deposit.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${vars.currency} ${vars.amount}</p>
            <p><strong>Payment Method:</strong> ${vars.paymentMethod}</p>
            <p><strong>New Balance:</strong> ${vars.currency} ${vars.newBalance}</p>
            <p><strong>Date:</strong> ${vars.date}</p>
          </div>
          <p>Your funds are now available in your wallet.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      kyc_rejected: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">KYC Verification Update</h2>
          <p>Hello ${vars.name},</p>
          <p>We've reviewed your identity verification documents, and unfortunately, we need additional information.</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            ${vars.reason ? `<p><strong>Reason:</strong> ${vars.reason}</p>` : ''}
            ${vars.next_steps ? `<p><strong>Next Steps:</strong> ${vars.next_steps}</p>` : ''}
          </div>
          <p>Please log in to your account to review the requirements and resubmit your documents.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      invoice_generated: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Invoice</h2>
          <p>Hello ${vars.name},</p>
          <p>A new invoice has been generated for you.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Invoice Number:</strong> ${vars.invoice_number || vars.invoiceNumber || 'N/A'}</p>
            <p><strong>Amount:</strong> ${vars.currency || 'USD'} ${vars.amount}</p>
            <p><strong>Due Date:</strong> ${vars.due_date || vars.dueDate || 'N/A'}</p>
            <p><strong>Business:</strong> ${vars.business_name || vars.businessName || 'Payvost'}</p>
          </div>
          ${vars.download_link || vars.downloadLink ? `<div style="text-align: center; margin: 30px 0;">
            <a href="${vars.download_link || vars.downloadLink}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Invoice</a>
          </div>` : ''}
          <p>Please make payment by the due date to avoid any late fees.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      invoice_reminder: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Invoice Payment Reminder</h2>
          <p>Hello ${vars.name},</p>
          <p>This is a friendly reminder that you have an outstanding invoice.</p>
          <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p><strong>Invoice Number:</strong> ${vars.invoice_number || vars.invoiceNumber || 'N/A'}</p>
            <p><strong>Amount:</strong> ${vars.currency || 'USD'} ${vars.amount}</p>
            <p><strong>Due Date:</strong> ${vars.due_date || vars.dueDate || 'N/A'}</p>
            <p><strong>Business:</strong> ${vars.business_name || vars.businessName || 'Payvost'}</p>
          </div>
          ${vars.download_link || vars.downloadLink ? `<div style="text-align: center; margin: 30px 0;">
            <a href="${vars.download_link || vars.downloadLink}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Invoice</a>
          </div>` : ''}
          <p>Please make payment as soon as possible to avoid any late fees.</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
      invoice_paid: (vars) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Invoice Paid ✓</h2>
          <p>Hello ${vars.name},</p>
          <p>Thank you! Your invoice payment has been received and processed.</p>
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p><strong>Invoice Number:</strong> ${vars.invoice_number || vars.invoiceNumber || 'N/A'}</p>
            <p><strong>Amount Paid:</strong> ${vars.currency || 'USD'} ${vars.amount}</p>
            <p><strong>Payment Date:</strong> ${vars.payment_date || vars.paymentDate || new Date().toLocaleDateString()}</p>
            <p><strong>Business:</strong> ${vars.business_name || vars.businessName || 'Payvost'}</p>
          </div>
          ${vars.download_link || vars.downloadLink ? `<div style="text-align: center; margin: 30px 0;">
            <a href="${vars.download_link || vars.downloadLink}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Receipt</a>
          </div>` : ''}
          <p>Your payment has been successfully processed. Thank you for your business!</p>
          <p>Best regards,<br>Payvost Team</p>
        </div>
      `,
    };

    return templates[template](variables);
  }

  /**
   * Send email notification via Mailgun API
   */
  async sendEmail(notification: EmailNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.emailConfigured) {
      console.error('Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const from = notification.from || process.env.MAILGUN_FROM_EMAIL || 'no-reply@payvost.com';
      const html = this.getEmailTemplate(notification.template, notification.variables);
      const text = html.replace(/<[^>]*>/g, '').trim(); // Generate text version from HTML

      const result = await sendEmail({
        to: notification.to,
        subject: notification.subject,
        html,
        text,
        from: `Payvost <${from}>`,
        tags: ['notification', notification.template],
        variables: notification.variables,
      });

      if (result.success) {
        console.log('Email sent successfully via Mailgun API:', result.messageId);
        return { success: true, messageId: result.messageId };
      } else {
        console.error('Failed to send email:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS notification via Twilio
   * Note: This is a placeholder. Actual Twilio integration will be added later.
   */
  async sendSMS(notification: SMSNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.twilioConfigured) {
      console.warn('Twilio not configured. SMS will not be sent.');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      // TODO: Implement actual Twilio integration
      // const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // const message = await twilioClient.messages.create({
      //   body: notification.message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: notification.to
      // });
      
      console.log('SMS would be sent to:', notification.to);
      console.log('Message:', notification.message);
      
      // Placeholder response
      return { 
        success: true, 
        messageId: 'placeholder-' + Date.now(),
        error: 'Twilio integration pending'
      };
    } catch (error: any) {
      console.error('Failed to send SMS:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to user about external transaction
   */
  async notifyExternalTransaction(params: {
    userId: string;
    userEmail: string;
    userName: string;
    type: 'success' | 'failed';
    transactionType: 'bill_payment' | 'gift_card' | 'airtime_topup';
    details: Record<string, any>;
  }): Promise<void> {
    const { userEmail, userName, type, transactionType, details } = params;

    // Determine email template
    let template: EmailTemplate;
    let subject: string;

    if (transactionType === 'bill_payment') {
      template = type === 'success' ? 'bill_payment_success' : 'bill_payment_failed';
      subject = type === 'success' ? 'Bill Payment Successful' : 'Bill Payment Failed';
    } else if (transactionType === 'gift_card') {
      template = 'gift_card_delivered';
      subject = 'Your Gift Card is Ready!';
    } else {
      template = 'airtime_topup_success';
      subject = 'Airtime Top-up Successful';
    }

    const variables = {
      name: userName,
      date: new Date().toLocaleString(),
      ...details,
    };

    await this.sendEmail({
      to: userEmail,
      subject,
      template,
      variables,
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Legacy exports for compatibility (these can be deprecated later)
export async function sendVerificationWelcomeEmail(email: string, name: string) {
  return notificationService.sendEmail({
    to: email,
    subject: 'Account Verified!',
    template: 'kyc_verified',
    variables: { name },
  });
}

export async function sendBusinessApprovalEmail(email: string, name: string, businessName: string) {
  return notificationService.sendEmail({
    to: email,
    subject: 'Business Account Approved!',
    template: 'account_welcome',
    variables: { name, helpUrl: 'https://payvost.com/help' },
  });
}
