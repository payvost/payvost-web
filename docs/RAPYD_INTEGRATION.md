# Rapyd Integration Guide

## Overview

This document provides comprehensive information about integrating Rapyd services into the Payvost Web application. Rapyd is a global fintech-as-a-service platform that provides:

- **Payments**: Accept payments with 900+ payment methods across 100+ countries
- **Payouts**: Send money globally to bank accounts and wallets
- **Virtual Accounts**: Collect payments via virtual bank accounts
- **Wallets**: Digital wallet management for users
- **Card Issuing**: Issue virtual and physical cards
- **FX Services**: Real-time foreign exchange rates

## Table of Contents

1. [Getting Started](#getting-started)
2. [Configuration](#configuration)
3. [Service Usage](#service-usage)
4. [Authentication](#authentication)
5. [Webhook Integration](#webhook-integration)
6. [Error Handling](#error-handling)
7. [Testing](#testing)
8. [API Reference](#api-reference)

---

## Getting Started

### Prerequisites

1. **Rapyd Account**: Sign up at [https://dashboard.rapyd.net/](https://dashboard.rapyd.net/)
2. **API Credentials**: Obtain your Access Key and Secret Key from the Rapyd dashboard
3. **Environment Setup**: Configure your environment variables

### Quick Start

```typescript
import { rapydService } from '@/services';

// Get payment methods for a country
const paymentMethods = await rapydService.getPaymentMethodsByCountry('US');

// Create a payment
const payment = await rapydService.createPayment({
  amount: 100,
  currency: 'USD',
  payment_method: 'us_debit_visa_card',
  description: 'Order #12345'
});
```

---

## Configuration

### Environment Variables

Add the following to your `.env.local` or `.env` file:

```bash
# Rapyd Integration
RAPYD_ACCESS_KEY=your_access_key_here
RAPYD_SECRET_KEY=your_secret_key_here
RAPYD_ENV=sandbox  # or 'production'
```

### Integration Configuration

All Rapyd endpoints are defined in `/src/config/integration-partners.ts`:

```typescript
import { PAYMENT_GATEWAYS, getRapydBaseUrl } from '@/config/integration-partners';

// Get the appropriate base URL based on environment
const baseUrl = getRapydBaseUrl();
```

---

## Authentication

Rapyd uses HMAC-SHA256 signature authentication. The service automatically handles:

1. **Signature Generation**: Creates HMAC-SHA256 hash with salt and timestamp
2. **Request Signing**: Includes access_key, salt, timestamp, and signature headers
3. **Automatic Authentication**: All requests are automatically authenticated

### Authentication Flow

```typescript
// Automatic - handled by the service
const payment = await rapydService.createPayment({...});
// Headers automatically include:
// - access_key
// - salt (random 12-character string)
// - timestamp (Unix timestamp)
// - signature (HMAC-SHA256 hash)
```

---

## Service Usage

### Payments

#### Get Payment Methods by Country

```typescript
import { rapydService } from '@/services';

// Get all payment methods for United States
const methods = await rapydService.getPaymentMethodsByCountry('US');

methods.forEach(method => {
  console.log(`${method.name} (${method.type})`);
  console.log(`Currencies: ${method.currencies.join(', ')}`);
});
```

#### Get Required Fields for Payment Method

```typescript
const fields = await rapydService.getRequiredFields('us_debit_visa_card');

console.log('Required fields:', fields);
```

#### Create Payment

```typescript
const payment = await rapydService.createPayment({
  amount: 100,
  currency: 'USD',
  payment_method: 'us_debit_visa_card',
  description: 'Product purchase',
  customer: 'cus_123456',
  metadata: {
    order_id: '12345',
    customer_name: 'John Doe'
  },
  complete_payment_url: 'https://yoursite.com/success',
  error_payment_url: 'https://yoursite.com/error'
});

console.log(`Payment ID: ${payment.id}`);
console.log(`Status: ${payment.status}`);
console.log(`Redirect URL: ${payment.redirect_url}`);
```

#### Get Payment Status

```typescript
const payment = await rapydService.getPayment('payment_123456');

console.log(`Payment status: ${payment.status}`);
console.log(`Amount: ${payment.amount} ${payment.currency_code}`);
console.log(`Paid: ${payment.paid}`);
```

#### Cancel Payment

```typescript
const cancelledPayment = await rapydService.cancelPayment('payment_123456');

console.log(`Payment cancelled: ${cancelledPayment.status}`);
```

### Customers

#### Create Customer

```typescript
const customer = await rapydService.createCustomer({
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone_number: '+1234567890',
  metadata: {
    user_id: 'user_12345'
  }
});

console.log(`Customer ID: ${customer.id}`);
```

#### Get Customer

```typescript
const customer = await rapydService.getCustomer('cus_123456');

console.log(`Name: ${customer.name}`);
console.log(`Email: ${customer.email}`);
console.log(`Default Payment Method: ${customer.default_payment_method}`);
```

### Payouts

#### Create Payout

```typescript
const payout = await rapydService.createPayout({
  beneficiary: 'beneficiary_id',
  sender: 'sender_id',
  sender_country: 'US',
  sender_currency: 'USD',
  sender_entity_type: 'individual',
  sender_amount: 100,
  payout_method_type: 'us_general_bank',
  description: 'Salary payment',
  metadata: {
    employee_id: 'emp_12345'
  }
});

console.log(`Payout ID: ${payout.id}`);
console.log(`Status: ${payout.status}`);
```

#### Get Payout Status

```typescript
const payout = await rapydService.getPayout('payout_123456');

console.log(`Status: ${payout.status}`);
console.log(`Amount: ${payout.amount} ${payout.payout_currency}`);
```

### Virtual Accounts

#### Create Virtual Account

```typescript
const virtualAccount = await rapydService.createVirtualAccount({
  currency: 'USD',
  country: 'US',
  description: 'Business collection account',
  metadata: {
    business_id: 'biz_12345'
  }
});

console.log(`Virtual Account ID: ${virtualAccount.id}`);
console.log(`Account Number: ${virtualAccount.bank_account.account_number}`);
console.log(`Routing Number: ${virtualAccount.bank_account.routing_number}`);
```

#### Get Virtual Account

```typescript
const account = await rapydService.getVirtualAccount('va_123456');

console.log(`Status: ${account.status}`);
console.log(`Balance: ${account.transactions.length} transactions`);
```

### Wallets

#### Create Wallet

```typescript
const wallet = await rapydService.createWallet({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  type: 'person',
  contact: {
    phone_number: '+1234567890',
    email: 'john.doe@example.com',
    country: 'US'
  },
  metadata: {
    user_id: 'user_12345'
  }
});

console.log(`Wallet ID: ${wallet.id}`);
console.log(`Status: ${wallet.status}`);
wallet.accounts.forEach(account => {
  console.log(`${account.currency}: ${account.balance}`);
});
```

#### Get Wallet

```typescript
const wallet = await rapydService.getWallet('ewallet_123456');

console.log(`Wallet Type: ${wallet.type}`);
console.log(`Verification Status: ${wallet.verification_status}`);
```

#### Transfer Between Wallets

```typescript
const transfer = await rapydService.transferBetweenWallets({
  source_ewallet: 'ewallet_source',
  destination_ewallet: 'ewallet_dest',
  amount: 50,
  currency: 'USD',
  description: 'Payment for services'
});

console.log('Transfer completed:', transfer);
```

### Exchange Rates

#### Get Exchange Rates

```typescript
// For payment
const paymentRate = await rapydService.getExchangeRates(
  'payment',
  'EUR',  // buy currency
  'USD',  // sell currency
  100     // amount
);

console.log(`Exchange Rate: ${paymentRate.rate}`);
console.log(`Buy Amount: ${paymentRate.buy_amount} ${paymentRate.buy_currency}`);

// For payout
const payoutRate = await rapydService.getExchangeRates(
  'payout',
  'GBP',
  'EUR',
  200
);

console.log(`Payout Rate: ${payoutRate.rate}`);
```

---

## Webhook Integration

### Webhook Events

Rapyd sends webhooks for various events:

- `PAYMENT_COMPLETED` - Payment successfully completed
- `PAYMENT_FAILED` - Payment failed
- `PAYOUT_COMPLETED` - Payout completed
- `PAYOUT_FAILED` - Payout failed
- `TRANSFER_COMPLETED` - Wallet transfer completed
- `CREATED_VIRTUAL_ACCOUNT_TRANSACTION` - Funds received in virtual account

### Creating a Webhook Endpoint

```typescript
// src/app/api/webhooks/rapyd/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('signature');
    const salt = request.headers.get('salt');
    const timestamp = request.headers.get('timestamp');
    
    // Verify signature
    const expectedSignature = createHmac('sha256', process.env.RAPYD_SECRET_KEY!)
      .update(`${salt}${timestamp}${body}`)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const event = JSON.parse(body);
    
    // Handle event
    switch (event.type) {
      case 'PAYMENT_COMPLETED':
        await handlePaymentCompleted(event.data);
        break;
      case 'PAYOUT_COMPLETED':
        await handlePayoutCompleted(event.data);
        break;
      // ... other events
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

---

## Error Handling

### RapydError Class

All Rapyd service methods throw `RapydError` on failure:

```typescript
import { rapydService, RapydError } from '@/services';

try {
  await rapydService.createPayment(paymentData);
} catch (error) {
  if (error instanceof RapydError) {
    console.error(`Rapyd Error [${error.statusCode}]:`, error.message);
    console.error('Response:', error.response);
  }
}
```

### Common Error Codes

- `AUTHENTICATION_ERROR` - Invalid credentials or signature
- `INVALID_REQUEST` - Missing or invalid parameters
- `RESOURCE_NOT_FOUND` - Resource does not exist
- `INSUFFICIENT_FUNDS` - Not enough balance for operation
- `RATE_LIMIT_EXCEEDED` - Too many requests

### Best Practices

```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

try {
  const payment = await rapydService.createPayment(paymentData);
  toast({
    title: 'Payment Created',
    description: `Payment ID: ${payment.id}`
  });
} catch (error) {
  toast({
    title: 'Payment Failed',
    description: error instanceof Error ? error.message : 'An error occurred',
    variant: 'destructive'
  });
}
```

---

## Testing

### Sandbox Testing

1. **Use sandbox mode** for development:
   ```bash
   RAPYD_ENV=sandbox
   ```

2. **Test Credentials**: Use sandbox credentials from Rapyd dashboard

3. **Test Cards**: Use Rapyd's test card numbers
   - Visa: `4111111111111111`
   - Mastercard: `5555555555554444`
   - CVV: `123`
   - Expiry: Any future date

### Testing Checklist

- [ ] Test authentication and signature generation
- [ ] Test payment creation with various methods
- [ ] Test customer creation and retrieval
- [ ] Test payout creation
- [ ] Test virtual account creation
- [ ] Test wallet creation and transfers
- [ ] Test exchange rate retrieval
- [ ] Test webhook reception
- [ ] Test error handling
- [ ] Test with production credentials (small amounts)

---

## API Reference

### Rapyd Service Methods

#### Payments

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getPaymentMethodsByCountry()` | countryCode | `Promise<PaymentMethod[]>` | Get payment methods |
| `getRequiredFields()` | paymentMethodType | `Promise<any>` | Get required fields |
| `createPayment()` | CreatePaymentRequest | `Promise<Payment>` | Create payment |
| `getPayment()` | paymentId | `Promise<Payment>` | Get payment details |
| `cancelPayment()` | paymentId | `Promise<Payment>` | Cancel payment |

#### Customers

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `createCustomer()` | CreateCustomerRequest | `Promise<Customer>` | Create customer |
| `getCustomer()` | customerId | `Promise<Customer>` | Get customer details |

#### Payouts

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `createPayout()` | CreatePayoutRequest | `Promise<Payout>` | Create payout |
| `getPayout()` | payoutId | `Promise<Payout>` | Get payout details |

#### Virtual Accounts

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `createVirtualAccount()` | CreateVirtualAccountRequest | `Promise<VirtualAccount>` | Create virtual account |
| `getVirtualAccount()` | virtualAccountId | `Promise<VirtualAccount>` | Get account details |

#### Wallets

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `createWallet()` | CreateWalletRequest | `Promise<Wallet>` | Create wallet |
| `getWallet()` | walletId | `Promise<Wallet>` | Get wallet details |
| `transferBetweenWallets()` | transfer data | `Promise<any>` | Transfer funds |

#### Exchange Rates

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getExchangeRates()` | actionType, buy, sell, amount? | `Promise<any>` | Get FX rates |

---

## Additional Resources

- **Rapyd Documentation**: [https://docs.rapyd.net/](https://docs.rapyd.net/)
- **Rapyd Dashboard**: [https://dashboard.rapyd.net/](https://dashboard.rapyd.net/)
- **Integration Config**: `/src/config/integration-partners.ts`
- **Rapyd Service**: `/src/services/rapydService.ts`

---

## Support

For issues with the integration:
1. Check the Rapyd API status page
2. Review error logs for detailed error messages
3. Test with sandbox credentials first
4. Contact Rapyd support for API-specific issues

For code-related questions, refer to the inline documentation in the service files.
