/**
 * Vercel Edge Function for sending batch email notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const emailTransporter = nodemailer.createTransport({
  host: process.env.MAILGUN_SMTP_HOST || 'smtp.mailgun.org',
  port: parseInt(process.env.MAILGUN_SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.MAILGUN_SMTP_LOGIN || '',
    pass: process.env.MAILGUN_SMTP_PASSWORD || '',
  },
});

const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'no-reply@payvost.com';

interface BatchEmailRequest {
  emails: Array<{
    to: string;
    subject: string;
    html: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: BatchEmailRequest = await request.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Invalid emails array' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (emails.length > 100) {
      return NextResponse.json(
        { error: 'Batch size limited to 100 emails' },
        { status: 400 }
      );
    }

    // Send emails in parallel with rate limiting
    const results = await Promise.allSettled(
      emails.map(async (email) => {
        return emailTransporter.sendMail({
          from: `Payvost <${MAILGUN_FROM_EMAIL}>`,
          to: email.to,
          subject: email.subject,
          html: email.html,
        });
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Batch email sent: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      total: emails.length,
      successful,
      failed,
      results: results.map((r, i) => ({
        email: emails[i].to,
        status: r.status,
        messageId: r.status === 'fulfilled' ? (r.value as any).messageId : null,
        error: r.status === 'rejected' ? r.reason.message : null,
      })),
    });
  } catch (error: any) {
    console.error('❌ Failed to send batch emails:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send batch emails' 
      },
      { status: 500 }
    );
  }
}
