/**
 * Vercel Edge Function for sending email notifications
 * This replaces the need for Firebase Functions for manual email sending
 * Uses Mailgun API for email delivery
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailgun';

const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'no-reply@payvost.com';

// Email templates
function getEmailHTML(type: string, data: any): string {
  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
  `;
  const baseEnd = `
      </div>
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Payvost. All rights reserved.</p>
      </div>
    </div>
  `;

  switch (type) {
    case 'kyc_approved':
      return baseStyle + `
        <h2 style="color: #10b981; margin-bottom: 20px;">✓ KYC Verification Approved</h2>
        <p>Hello ${data.name},</p>
        <p>Congratulations! Your identity verification has been approved.</p>
        <p>You now have full access to all Payvost features.</p>
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;

    case 'transaction_success':
      return baseStyle + `
        <h2 style="color: #10b981; margin-bottom: 20px;">✓ Transaction Successful</h2>
        <p>Hello ${data.name},</p>
        <p>Your transaction has been completed successfully.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          ${data.recipientName ? `<p><strong>Recipient:</strong> ${data.recipientName}</p>` : ''}
          <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
        </div>
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;

    case 'invoice_generated':
      return baseStyle + `
        <h2 style="color: #1f2937; margin-bottom: 20px;">New Invoice</h2>
        <p>Hello ${data.name},</p>
        <p>You have received a new invoice.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
        ${data.downloadLink ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${data.downloadLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Invoice</a>
        </p>
        ` : ''}
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;

    case 'custom':
      return baseStyle + `
        <h2 style="color: #1f2937; margin-bottom: 20px;">${data.title || 'Notification'}</h2>
        <p>Hello ${data.name},</p>
        ${data.message ? `<div style="margin: 20px 0;">${data.message}</div>` : ''}
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;

    default:
      return baseStyle + `
        <p>Hello ${data.name},</p>
        <p>You have a new notification from Payvost.</p>
        <p>Best regards,<br>The Payvost Team</p>
      ` + baseEnd;
  }
}

interface EmailRequest {
  to: string;
  subject: string;
  type: string;
  data: {
    name: string;
    [key: string]: any;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (you can add your auth logic here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: EmailRequest = await request.json();
    const { to, subject, type, data } = body;

    // Validate required fields
    if (!to || !subject || !data?.name) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, data.name' },
        { status: 400 }
      );
    }

    // Send email via Mailgun API
    const html = getEmailHTML(type, data);
    const result = await sendEmail({
      to,
      subject,
      html,
      from: `Payvost <${MAILGUN_FROM_EMAIL}>`,
      tags: ['notification', type],
    });

    if (!result.success) {
      console.error('❌ Failed to send email:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to send email' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Email sent successfully:', result.messageId);

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send email' 
      },
      { status: 500 }
    );
  }
}
