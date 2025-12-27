#!/usr/bin/env node

/**
 * Test All Email Templates via Mailgun Direct API
 * 
 * This script tests all email templates by sending test emails using Mailgun
 */

const FormData = require('form-data');
const Mailgun = require('mailgun.js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const mailgunApiKey = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;
const fromEmail = process.env.MAILGUN_FROM_EMAIL;
const recipient = process.argv[2] || 'kehinde504@gmail.com';

if (!mailgunApiKey || !mailgunDomain) {
  console.error('\n❌ Error: Mailgun credentials not found in backend/.env');
  console.error('   MAILGUN_API_KEY:', mailgunApiKey ? '✅ Set' : '❌ Missing');
  console.error('   MAILGUN_DOMAIN:', mailgunDomain ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: mailgunApiKey,
});

const templates = [
  {
    name: 'Test Email (Raw HTML)',
    subject: 'Payvost Test Email - System Verification',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #10b981;">Payvost Email Test ✓</h2>
          <p>This is a test email to verify that Mailgun is properly configured.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Test Type:</strong> Raw HTML Email</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p><strong>Domain:</strong> ${mailgunDomain}</p>
          </div>
          <p>If you received this email, Mailgun is working correctly!</p>
          <p>Best regards,<br>Payvost Team</p>
        </body>
      </html>
    `,
  },
  {
    name: 'invoice-reminder',
    subject: 'Invoice Reminder: INV-2025-001 - Payment Due 2025-12-31',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">Invoice Reminder</h2>
          <p>Hello Test Customer,</p>
          <p>This is a friendly reminder that your invoice payment is due soon.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p><strong>Invoice Number:</strong> INV-2025-001</p>
            <p><strong>Amount Due:</strong> 1000.00 USD</p>
            <p><strong>Due Date:</strong> 2025-12-31</p>
          </div>
          <p>Please arrange for payment at your earliest convenience.</p>
          <p>If you have already paid, please disregard this reminder.</p>
          <p>Best regards,<br>Payvost Team</p>
        </body>
      </html>
    `,
  },
  {
    name: 'transaction-success',
    subject: 'Transaction Successful - Transfer Completed',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">Transaction Successful ✓</h2>
          <p>Hello Test User,</p>
          <p>Your transaction has been completed successfully.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p><strong>Transaction Type:</strong> Transfer</p>
            <p><strong>Amount:</strong> 500.00 USD</p>
            <p><strong>Recipient:</strong> john@example.com</p>
            <p><strong>Transaction ID:</strong> TXN-2025-001234</p>
            <p><strong>Date & Time:</strong> ${new Date().toISOString()}</p>
          </div>
          <p>Best regards,<br>Payvost Team</p>
        </body>
      </html>
    `,
  },
  {
    name: 'kyc-approved',
    subject: 'Account Verified - KYC Approval Confirmed',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">Account Verified ✓</h2>
          <p>Hello Test User,</p>
          <p>Congratulations! Your account has been successfully verified.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p><strong>Status:</strong> KYC Verification Approved</p>
            <p><strong>Account Type:</strong> Standard</p>
            <p><strong>Verification Date:</strong> ${new Date().toISOString()}</p>
          </div>
          <p>You now have full access to all Payvost features including:</p>
          <ul>
            <li>Money transfers</li>
            <li>Bill payments</li>
            <li>Invoicing</li>
            <li>Higher transaction limits</li>
          </ul>
          <p>Best regards,<br>Payvost Team</p>
        </body>
      </html>
    `,
  },
  {
    name: 'login-notification',
    subject: 'Login Notification - New Device Access',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #f59e0b;">Login Notification</h2>
          <p>Hello Test User,</p>
          <p>We detected a login to your Payvost account from a new device.</p>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p><strong>Device:</strong> Windows - Node.js Test</p>
            <p><strong>IP Address:</strong> 192.168.1.100</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>
          <p>If this was you, you can safely ignore this message.</p>
          <p>If you did not authorize this login, please change your password immediately.</p>
          <p>Best regards,<br>Payvost Security Team</p>
        </body>
      </html>
    `,
  },
];

async function sendTestEmails() {
  console.log('\n' + '='.repeat(70));
  console.log('📧 Email Template Test Suite - Mailgun Direct');
  console.log('='.repeat(70));
  console.log(`\nRecipient: ${recipient}`);
  console.log(`Domain: ${mailgunDomain}`);
  console.log(`From: ${fromEmail}`);
  console.log(`Templates: ${templates.length}\n`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const number = i + 1;

    console.log(`[${number}/${templates.length}] Testing: ${template.name}`);
    console.log(`   Subject: ${template.subject}`);

    try {
      const result = await mg.messages.create(mailgunDomain, {
        from: fromEmail,
        to: [recipient],
        subject: template.subject,
        html: template.html,
      });

      console.log(`   ✅ SUCCESS - Email queued`);
      console.log(`   Message ID: ${result.id}\n`);
      successCount++;
    } catch (error) {
      console.log(`   ❌ FAILED - ${error.message}\n`);
      failureCount++;
    }

    // Delay between emails to avoid rate limiting
    if (i < templates.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('='.repeat(70));
  console.log('📊 Test Summary');
  console.log('='.repeat(70));
  console.log(`\nTotal Tests: ${templates.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);

  if (failureCount === 0) {
    console.log(`\n✅ All ${templates.length} templates sent successfully!`);
    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Check ${recipient} inbox for ${templates.length} emails`);
    console.log(`   2. Review email content and formatting`);
    console.log(`   3. Check Mailgun dashboard: https://app.mailgun.com`);
    console.log(`   4. Verify delivery status and sender reputation\n`);
  } else {
    console.log(`\n❌ ${failureCount} template(s) failed. Check errors above.\n`);
  }
}

sendTestEmails().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
