#!/usr/bin/env node

/**
 * Test Mailgun Templates - Using Actual Templates from Mailgun Account
 * 
 * This script tests all email templates stored in Mailgun
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
  process.exit(1);
}

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: mailgunApiKey,
});

// Template names from Mailgun dashboard
const templates = [
  {
    name: 'invoice-reminder',
    mailgunTemplate: 'invoice reminder template',
    subject: 'Invoice Reminder: INV-2025-001',
    variables: {
      invoiceNumber: 'INV-2025-001',
      amount: '1000.00',
      currency: 'USD',
      dueDate: '2025-12-31',
      customerName: 'Test Customer',
    },
    description: 'Invoice payment reminder using Mailgun template',
  },
  {
    name: 'invoice-generated',
    mailgunTemplate: 'invoice generated template',
    subject: 'Your Invoice INV-2025-002 has been created',
    variables: {
      invoiceNumber: 'INV-2025-002',
      amount: '2500.00',
      currency: 'USD',
      dueDate: '2026-01-31',
      customerName: 'Test Customer',
      issueDate: '2025-12-27',
    },
    description: 'New invoice created notification using Mailgun template',
  },
  {
    name: 'kyc-approved',
    mailgunTemplate: 'kyc approved template',
    subject: 'Account Verified - KYC Approved',
    variables: {
      name: 'Test User',
      approvalDate: '2025-12-27',
      kycLevel: 'Verified',
    },
    description: 'KYC verification approval using Mailgun template',
  },
  {
    name: 'login-notification',
    mailgunTemplate: 'login notification template',
    subject: 'New Login Detected - Payvost Account',
    variables: {
      name: 'Test User',
      device: 'Windows - Chrome Browser',
      ipAddress: '192.168.1.100',
      timestamp: new Date().toISOString(),
      country: 'Nigeria',
    },
    description: 'Login security notification using Mailgun template',
  },
  {
    name: 'rate-alert',
    mailgunTemplate: 'rate alert email template',
    subject: 'Currency Rate Alert - USD/NGN',
    variables: {
      currency1: 'USD',
      currency2: 'NGN',
      rate: '1524.50',
      change: '+2.5%',
      timestamp: new Date().toISOString(),
      recommendation: 'Favorable time to exchange',
    },
    description: 'Currency rate alert using Mailgun template',
  },
  {
    name: 'transaction-success',
    mailgunTemplate: 'transaction success template',
    subject: 'Transaction Successful - Transfer Completed',
    variables: {
      name: 'Test User',
      transactionType: 'Transfer',
      amount: '500.00',
      currency: 'USD',
      recipient: 'john@example.com',
      transactionId: 'TXN-2025-001234',
      timestamp: new Date().toISOString(),
    },
    description: 'Transaction success confirmation using Mailgun template',
  },
  {
    name: 'daily-rate-summary',
    mailgunTemplate: 'daily rate summary email template',
    subject: 'Daily Rate Summary - December 27, 2025',
    variables: {
      date: '2025-12-27',
      usdNgn: '1524.50',
      usdGhs: '15.25',
      usdKes: '130.45',
      topPair: 'USD/NGN',
      topChange: '+2.5%',
    },
    description: 'Daily exchange rate summary using Mailgun template',
  },
];

async function sendTestEmails() {
  console.log('\n' + '='.repeat(80));
  console.log('📧 Mailgun Template Test Suite - Using Actual Templates');
  console.log('='.repeat(80));
  console.log(`\nRecipient: ${recipient}`);
  console.log(`Domain: ${mailgunDomain}`);
  console.log(`From: ${fromEmail}`);
  console.log(`Templates: ${templates.length}\n`);

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const number = i + 1;

    console.log(`[${number}/${templates.length}] Testing: ${template.name}`);
    console.log(`   Mailgun Template: "${template.mailgunTemplate}"`);
    console.log(`   Subject: ${template.subject}`);
    console.log(`   Description: ${template.description}`);

    try {
      const result = await mg.messages.create(mailgunDomain, {
        from: fromEmail,
        to: [recipient],
        subject: template.subject,
        template: template.mailgunTemplate,
        'h:X-Mailgun-Variables': JSON.stringify(template.variables),
      });

      console.log(`   ✅ SUCCESS - Email queued`);
      console.log(`   Message ID: ${result.id}\n`);
      successCount++;
      results.push({
        template: template.name,
        status: 'SUCCESS',
        messageId: result.id,
      });
    } catch (error) {
      console.log(`   ❌ FAILED - ${error.message}\n`);
      failureCount++;
      results.push({
        template: template.name,
        status: 'FAILED',
        error: error.message,
      });
    }

    // Delay between emails to avoid rate limiting
    if (i < templates.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  // Summary
  console.log('='.repeat(80));
  console.log('📊 Test Summary');
  console.log('='.repeat(80));
  console.log(`\nTotal Tests: ${templates.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📈 Success Rate: ${Math.round((successCount / templates.length) * 100)}%\n`);

  // Detailed Results
  console.log('='.repeat(80));
  console.log('📋 Detailed Results');
  console.log('='.repeat(80));
  console.log('\n');

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.template}`);
    console.log(`   Status: ${result.status}`);
    if (result.messageId) {
      console.log(`   Message ID: ${result.messageId}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  if (failureCount === 0) {
    console.log(`✅ All ${templates.length} Mailgun templates sent successfully!`);
    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Check ${recipient} inbox for ${templates.length} emails`);
    console.log(`   2. Review formatting and content of each email`);
    console.log(`   3. Verify all template variables rendered correctly`);
    console.log(`   4. Check Mailgun dashboard for delivery status`);
    console.log(`   5. Test any failed templates individually\n`);
  } else {
    console.log(`\n❌ ${failureCount} template(s) failed.`);
    console.log(`\n🔍 Troubleshooting Tips:`);
    console.log(`   1. Verify template names match exactly (case-sensitive)`);
    console.log(`   2. Check template exists in Mailgun: https://app.mailgun.com`);
    console.log(`   3. Verify all variables are provided`);
    console.log(`   4. Check if template requires specific variables\n`);
  }
}

sendTestEmails().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
