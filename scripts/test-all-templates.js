#!/usr/bin/env node

/**
 * Test All Email Templates for Payvost
 * 
 * Sends test emails for each template to verify they're working
 * Usage: node test-all-templates.js <recipient-email>
 */

const http = require('http');

const RECIPIENT = process.argv[2] || 'kehinde504@gmail.com';
const API_URL = 'http://localhost:3001';

const templates = [
  {
    name: 'invoice-reminder',
    subject: 'Invoice Reminder: INV-2025-001',
    template: 'invoice-reminder',
    variables: {
      invoiceNumber: 'INV-2025-001',
      amount: '1000.00',
      currency: 'USD',
      dueDate: '2025-12-31',
      customerName: 'Test Customer',
    },
    description: 'Invoice reminder email when payment is due',
  },
  {
    name: 'login-notification',
    subject: 'Login Notification - New Device',
    template: 'login_notification',
    variables: {
      name: 'Test User',
      device: 'Windows - Node.js Test',
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
    },
    description: 'Alert user of login from new device',
  },
  {
    name: 'transaction-success',
    subject: 'Transaction Successful - Transfer Completed',
    template: 'transaction_success',
    variables: {
      name: 'Test User',
      currency: 'USD',
      amount: '500.00',
      recipient: 'john@example.com',
      date: new Date().toISOString(),
      transactionId: 'TXN-2025-001234',
    },
    description: 'Confirmation when money transfer succeeds',
  },
  {
    name: 'kyc-approved',
    subject: 'Account Verified - KYC Approved',
    template: 'kyc_verified',
    variables: {
      name: 'Test User',
    },
    description: 'Notify user when KYC verification is approved',
  },
];

function makeRequest(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : {},
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            body: { error: 'Failed to parse response', raw: data },
          });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('📧 Email Template Test Suite');
  console.log('='.repeat(60));
  console.log(`\nRecipient: ${RECIPIENT}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Templates: ${templates.length}`);
  console.log('\n');

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const number = i + 1;

    console.log(`[${number}/${templates.length}] Testing: ${template.name}`);
    console.log(`  Description: ${template.description}`);
    console.log(`  Subject: ${template.subject}`);

    try {
      const response = await makeRequest('/notification/send', {
        email: RECIPIENT,
        subject: template.subject,
        template: template.template,
        variables: template.variables,
      });

      if (response.statusCode === 200) {
        console.log(`  ✅ SUCCESS - Email queued for delivery`);
        console.log(`  Message: ${response.body.message || 'OK'}`);
        successCount++;
      } else {
        console.log(`  ❌ FAILED - HTTP ${response.statusCode}`);
        console.log(`  Error: ${response.body.error || 'Unknown error'}`);
        failureCount++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR - ${error.message}`);
      failureCount++;
    }

    console.log('');

    // Delay between requests
    if (i < templates.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`\nTotal Tests: ${templates.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);

  if (failureCount === 0) {
    console.log(`\n✅ All templates tested successfully!`);
    console.log(`\n📋 Next Steps:`);
    console.log(`  1. Check ${RECIPIENT} inbox for ${templates.length} emails`);
    console.log(`  2. Verify each email looks correct`);
    console.log(`  3. Check Mailgun dashboard: https://app.mailgun.com`);
    console.log(`  4. Verify sender: no-reply@payvost.com`);
  } else {
    console.log(`\n❌ Some templates failed. Check errors above.`);
    console.log(`\n🔧 Troubleshooting:`);
    console.log(`  1. Ensure backend is running: npm run dev:server`);
    console.log(`  2. Check MAILGUN_* environment variables in backend/.env`);
    console.log(`  3. Verify notification service is available`);
  }

  console.log('\n');
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
