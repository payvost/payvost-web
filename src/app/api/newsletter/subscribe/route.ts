/**
 * Newsletter Subscription API Route
 * Handles newsletter subscriptions using Mailgun API
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailgun';

const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'no-reply@payvost.com';
const NEWSLETTER_LIST_EMAIL = process.env.NEWSLETTER_LIST_EMAIL || 'newsletter@payvost.com';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Send welcome email to subscriber
    const welcomeHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3CB371; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Payvost!</h1>
            </div>
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for subscribing to our newsletter!</p>
            <p style="font-size: 16px; margin-bottom: 20px;">You'll now receive the latest updates about:</p>
            <ul style="font-size: 16px; margin-bottom: 30px; padding-left: 20px;">
              <li style="margin-bottom: 10px;">New features and product updates</li>
              <li style="margin-bottom: 10px;">Exchange rate insights and market trends</li>
              <li style="margin-bottom: 10px;">Security tips and best practices</li>
              <li style="margin-bottom: 10px;">Company news and announcements</li>
            </ul>
            <div style="background-color: #f0fdf4; border-left: 4px solid #3CB371; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <p style="margin: 0; font-size: 14px; color: #166534;">
                <strong>💡 Tip:</strong> Make sure to add ${MAILGUN_FROM_EMAIL} to your contacts to ensure our emails reach your inbox.
              </p>
            </div>
            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280; margin: 0;">
                If you didn't subscribe to this newsletter, you can safely ignore this email.
              </p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Payvost Inc. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Fast, Secure Global Remittance</p>
          </div>
        </body>
      </html>
    `;

    // Send notification to newsletter list (you can customize this)
    const notificationHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3CB371;">New Newsletter Subscription</h2>
            <p><strong>Email:</strong> ${trimmedEmail}</p>
            <p><strong>Subscribed at:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    // Send welcome email to subscriber
    const welcomeResult = await sendEmail({
      to: trimmedEmail,
      subject: 'Welcome to Payvost Newsletter! 🎉',
      html: welcomeHTML,
      from: `Payvost <${MAILGUN_FROM_EMAIL}>`,
      tags: ['newsletter', 'welcome'],
    });

    if (!welcomeResult.success) {
      console.error('Failed to send welcome email:', welcomeResult.error);
      // Continue anyway - subscription is still successful
    }

    // Optionally send notification to admin/list
    if (NEWSLETTER_LIST_EMAIL && NEWSLETTER_LIST_EMAIL !== 'newsletter@payvost.com') {
      try {
        await sendEmail({
          to: NEWSLETTER_LIST_EMAIL,
          subject: `New Newsletter Subscription: ${trimmedEmail}`,
          html: notificationHTML,
          from: `Payvost Newsletter <${MAILGUN_FROM_EMAIL}>`,
          tags: ['newsletter', 'admin-notification'],
        });
      } catch (notificationError) {
        // Log but don't fail the subscription
        console.warn('Failed to send notification email:', notificationError);
      }
    }

    console.log('✅ Newsletter subscription successful:', trimmedEmail);

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
    });
  } catch (error: any) {
    console.error('❌ Failed to process newsletter subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to subscribe to newsletter',
      },
      { status: 500 }
    );
  }
}

