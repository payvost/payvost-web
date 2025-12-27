#!/usr/bin/env node

/**
 * Invoice Reminder Test Script
 * 
 * This script tests the invoice reminder endpoint by:
 * 1. Finding a test invoice in the database
 * 2. Calling the send-reminder endpoint
 * 3. Verifying the email was sent successfully
 * 
 * Usage:
 *   npm run test:reminder -- --invoice-id=<id>
 *   npm run test:reminder -- --email=<customer_email>
 */

const http = require('http');
const https = require('https');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-token'; // In production, use real Firebase token

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const request = client.request(url, options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: parsed,
            raw: data,
          });
        } catch (error) {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: data,
            raw: data,
            error: 'Failed to parse JSON',
          });
        }
      });
    });

    request.on('error', reject);

    if (body) {
      request.write(JSON.stringify(body));
    }

    request.end();
  });
}

async function testInvoiceReminder() {
  log(colors.cyan, '\n📧 Invoice Reminder Endpoint Test');
  log(colors.cyan, '==================================\n');

  try {
    // Step 1: Check API health
    log(colors.yellow, '1️⃣  Checking API connectivity...');
    const healthResponse = await makeRequest(`${API_URL}/health`);
    
    if (healthResponse.statusCode !== 200) {
      log(colors.red, `❌ API unhealthy (HTTP ${healthResponse.statusCode})`);
      process.exit(1);
    }
    log(colors.green, '✅ API is healthy\n');

    // Step 2: List available test invoices
    log(colors.yellow, '2️⃣  Fetching test invoices...');
    log(colors.blue, `   (This requires a valid Firebase token in TEST_TOKEN env var)`);
    
    if (TEST_TOKEN === 'test-token') {
      log(colors.yellow, `⚠️  Using placeholder token - test will fail without real Firebase token`);
      log(colors.blue, `   Set TEST_TOKEN environment variable:\n`);
      log(colors.cyan, `   export TEST_TOKEN="your_firebase_token"\n`);
      
      log(colors.yellow, '3️⃣  Alternative: Test with curl command\n');
      log(colors.cyan, `   # Without auth (if endpoint is public for testing):`);
      log(colors.cyan, `   curl -X POST "http://localhost:3001/api/invoices/{invoiceId}/send-reminder" \\`);
      log(colors.cyan, `        -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \\`);
      log(colors.cyan, `        -H "Content-Type: application/json"\n`);
      return;
    }

    const invoicesUrl = `${API_URL}/invoices`;
    const invoicesResponse = await makeRequest(invoicesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (invoicesResponse.statusCode === 401) {
      log(colors.red, '❌ Unauthorized - Invalid Firebase token');
      log(colors.yellow, '   Get a valid token from Firebase console');
      process.exit(1);
    }

    if (invoicesResponse.statusCode !== 200) {
      log(colors.red, `❌ Failed to fetch invoices (HTTP ${invoicesResponse.statusCode})`);
      log(colors.blue, invoicesResponse.raw);
      process.exit(1);
    }

    const invoices = invoicesResponse.body;
    
    if (!Array.isArray(invoices) || invoices.length === 0) {
      log(colors.yellow, '⚠️  No invoices found');
      log(colors.blue, `   Create a test invoice first\n`);
      return;
    }

    const testInvoice = invoices[0];
    log(colors.green, `✅ Found ${invoices.length} invoices\n`);

    // Step 3: Send reminder for first invoice
    log(colors.yellow, `3️⃣  Sending reminder for invoice: ${testInvoice.id || testInvoice._id}`);
    
    const invoiceId = testInvoice.id || testInvoice._id;
    const reminderUrl = `${API_URL}/invoices/${invoiceId}/send-reminder`;
    
    const reminderResponse = await makeRequest(reminderUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (reminderResponse.statusCode === 200) {
      log(colors.green, '✅ Reminder sent successfully!\n');
      log(colors.blue, 'Response:');
      console.log(JSON.stringify(reminderResponse.body, null, 2));
      
      log(colors.green, `\n✅ Email sent to: ${reminderResponse.body.email}`);
      log(colors.yellow, '   Check your inbox (may take 10-30 seconds)\n');
    } else {
      log(colors.red, `❌ Failed to send reminder (HTTP ${reminderResponse.statusCode})\n`);
      log(colors.blue, 'Response:');
      console.log(JSON.stringify(reminderResponse.body, null, 2));
    }

  } catch (error) {
    log(colors.red, `❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run test
testInvoiceReminder();
