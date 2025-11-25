'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/mailgun';

interface CustomEmailOptions {
  email: string;
  displayName?: string;
  appName?: string;
}

const APP_NAME = 'Payvost';
// Use payvost.com as the action URL (custom domain)
const ACTION_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://payvost.com';

/**
 * Sends a custom email verification using Firebase Admin SDK to generate the link
 * and Mailgun to send the email with custom branding
 */
export async function sendCustomVerificationEmail({ 
  email, 
  displayName = 'User',
  appName = APP_NAME
}: CustomEmailOptions) {
  try {
    // Generate the action link using Firebase Admin SDK
    const actionCodeSettings = {
      url: `${ACTION_URL}/auth/action`,
      handleCodeInApp: true,
    };

    const link = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

    // Custom email template matching your requirements
    const emailSubject = `Verify your email for ${appName}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 20px 0; font-size: 16px;">Hello ${displayName},</p>
          <p style="margin: 0 0 20px 0; font-size: 16px;">Follow this link to verify your email address.</p>
          <p style="margin: 30px 0;">
            <a href="${link}" style="background-color: #3CB371; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p style="margin: 20px 0; font-size: 14px; color: #666; word-break: break-all;">
            Or copy and paste this link into your browser:<br>
            <a href="${link}" style="color: #3CB371;">${link}</a>
          </p>
          <p style="margin: 30px 0 0 0; font-size: 14px; color: #666;">
            If you didn't ask to verify this address, you can ignore this email.
          </p>
          <p style="margin: 30px 0 0 0; font-size: 16px;">Thanks,</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">Your ${appName} team</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="margin: 0; font-size: 12px; color: #888; text-align: center;">
            This email was sent from noreply@payvost.com<br>
            &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    const emailText = `Hello ${displayName},

Follow this link to verify your email address.
${link}

If you didn't ask to verify this address, you can ignore this email.

Thanks,
Your ${appName} team
    `;

    // Send email using Mailgun
    const result = await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      from: `noreply@payvost.com`,
      replyTo: `noreply@payvost.com`,
      tags: ['email-verification'],
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send verification email');
    }

    return { success: true, messageId: result.messageId, link };
  } catch (error: any) {
    console.error('Error sending custom verification email:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

