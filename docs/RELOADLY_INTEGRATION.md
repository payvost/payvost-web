# Reloadly Integration Guide

## Overview

This document provides comprehensive information about integrating Reloadly services into the Payvost Web application. Reloadly provides APIs for:

- **Airtime Top-ups**: Send mobile airtime to any operator worldwide
- **Data Bundles**: Purchase data plans for mobile operators
- **Gift Cards**: Buy and send digital gift cards from popular brands
- **Utility Bills**: Pay electricity, water, and other utility bills

## Table of Contents

1. [Getting Started](#getting-started)
2. [Configuration](#configuration)
3. [Service Usage](#service-usage)
4. [Webhook Integration](#webhook-integration)
5. [Error Handling](#error-handling)
6. [Testing](#testing)
7. [API Reference](#api-reference)

---

## Getting Started

### Prerequisites

1. **Reloadly Account**: Sign up at [https://www.reloadly.com/developers/](https://www.reloadly.com/developers/)
2. **API Credentials**: Obtain your Client ID, Client Secret, and Webhook Secret from the Reloadly dashboard
3. **Environment Setup**: Configure your environment variables

### Quick Start

```typescript
import { reloadlyService } from '@/services';

// Get operators for a country
const operators = await reloadlyService.getOperatorsByCountry('NG');

// Send airtime topup
const result = await reloadlyService.sendTopup({
  operatorId: 341,
  amount: 100,
  recipientPhone: {
    countryCode: 'NG',
    number: '8012345678'
  }
});
```

---

## Configuration

### Environment Variables

Add the following to your `.env.local` or `.env` file:

```bash
# Reloadly Integration
RELOADLY_CLIENT_ID=your_client_id_here
RELOADLY_CLIENT_SECRET=your_client_secret_here
RELOADLY_WEBHOOK_SECRET=your_webhook_secret_here
RELOADLY_ENV=sandbox  # or 'production'
```

### Integration Partners Configuration

All Reloadly endpoints are defined in `/src/config/integration-partners.ts`:

```typescript
import { RELOADLY, getReloadlyBaseUrl } from '@/config/integration-partners';

// Get the appropriate base URL based on environment
const baseUrl = getReloadlyBaseUrl('airtime');  // or 'giftcards', 'utilities'
```

---

## Service Usage

### Airtime Top-ups

#### List All Operators

```typescript
import { reloadlyService } from '@/services';

// Get all operators
const operators = await reloadlyService.getOperators(
  true,  // includeData
  true,  // includeBundles
  false  // simplified
);

// Get operators by country
const nigerianOperators = await reloadlyService.getOperatorsByCountry('NG');
```

#### Auto-Detect Operator

```typescript
const operator = await reloadlyService.autoDetectOperator(
  '8012345678',  // phone number
  'NG'           // country code
);

console.log(`Detected operator: ${operator.operatorName}`);
```

#### Send Topup

```typescript
const result = await reloadlyService.sendTopup({
  operatorId: 341,
  amount: 100,
  recipientPhone: {
    countryCode: 'NG',
    number: '8012345678'
  },
  senderPhone: {
    countryCode: 'US',
    number: '1234567890'
  },
  customIdentifier: 'txn-12345'  // Optional tracking ID
});

console.log(`Transaction ID: ${result.transactionId}`);
console.log(`Status: Success`);
```

#### Get FX Rate

```typescript
const fxRate = await reloadlyService.getFxRate(341, 100);
console.log(`Exchange rate: ${fxRate.fxRate}`);
console.log(`Amount in local currency: ${fxRate.amount}`);
```

### Gift Cards

#### List Gift Card Products

```typescript
// Get all gift card products
const allProducts = await reloadlyService.getGiftCardProducts();

// Get products for a specific country
const usProducts = await reloadlyService.getGiftCardProducts('US');
```

#### Get Product Details

```typescript
const product = await reloadlyService.getGiftCardProduct(42);

console.log(`Product: ${product.productName}`);
console.log(`Denomination Type: ${product.denominationType}`);
console.log(`Min Amount: ${product.minRecipientDenomination}`);
console.log(`Max Amount: ${product.maxRecipientDenomination}`);
```

#### Order Gift Card

```typescript
const order = await reloadlyService.orderGiftCard({
  productId: 42,
  countryCode: 'US',
  quantity: 1,
  unitPrice: 25.00,
  customIdentifier: 'gift-12345',
  senderName: 'John Doe',
  recipientEmail: 'recipient@example.com',
  recipientPhoneDetails: {
    countryCode: 'US',
    phoneNumber: '1234567890'
  }
});

console.log(`Order ID: ${order.transactionId}`);
console.log(`Amount: ${order.amount} ${order.currencyCode}`);
```

#### Get Redeem Instructions

```typescript
const instructions = await reloadlyService.getRedeemInstructions(
  order.transactionId
);

// Instructions contain the gift card codes and redemption details
```

### Utility Bill Payments

#### List Billers

```typescript
// Get all billers
const allBillers = await reloadlyService.getBillers();

// Get billers by country
const ngBillers = await reloadlyService.getBillersByCountry('NG');

// Get specific biller
const biller = await reloadlyService.getBiller(123);
console.log(`Biller: ${biller.name}`);
console.log(`Type: ${biller.type}`);
console.log(`Min Amount: ${biller.localMinAmount} ${biller.localTransactionFeeCurrencyCode}`);
```

#### Pay Bill

```typescript
const payment = await reloadlyService.payBill({
  billerId: 123,
  subscriberAccountNumber: '1234567890',
  amount: 5000,
  customIdentifier: 'bill-12345',
  referenceId: 'ref-67890'  // Optional
});

console.log(`Payment ID: ${payment.transactionId}`);
console.log(`Status: ${payment.deliveryStatus}`);
console.log(`Fee: ${payment.fee} ${payment.currencyCode}`);
```

#### Check Account Balance

```typescript
const balance = await reloadlyService.getBalance();
console.log(`Balance: ${balance.balance} ${balance.currencyCode}`);
```

---

## Webhook Integration

### Webhook Endpoint

The webhook endpoint is located at `/api/webhooks/reloadly` and handles the following events:

- `topup.success` - Airtime topup completed successfully
- `topup.failed` - Airtime topup failed
- `giftcard.order.success` - Gift card order completed
- `giftcard.order.failed` - Gift card order failed
- `bill.payment.success` - Bill payment completed
- `bill.payment.failed` - Bill payment failed

### Webhook Configuration

1. **Set up webhook URL** in Reloadly dashboard:
   ```
   https://your-domain.com/api/webhooks/reloadly
   ```

2. **Configure webhook secret** in environment variables:
   ```bash
   RELOADLY_WEBHOOK_SECRET=your_webhook_secret
   ```

### Webhook Security

The webhook handler verifies signatures using HMAC-SHA256:

```typescript
import { createHmac } from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return digest === signature;
}
```

### Testing Webhooks

You can test the webhook endpoint with a GET request:

```bash
curl https://your-domain.com/api/webhooks/reloadly
```

Expected response:
```json
{
  "status": "ok",
  "message": "Reloadly webhook endpoint is active",
  "timestamp": "2025-11-01T21:30:00.000Z"
}
```

---

## Error Handling

### ReloadlyError Class

All Reloadly service methods throw `ReloadlyError` on failure:

```typescript
import { reloadlyService, ReloadlyError } from '@/services';

try {
  await reloadlyService.sendTopup(request);
} catch (error) {
  if (error instanceof ReloadlyError) {
    console.error(`Reloadly Error [${error.statusCode}]:`, error.message);
    console.error('Response:', error.response);
  }
}
```

### Common Error Codes

- `401` - Authentication failed (invalid credentials)
- `400` - Bad request (invalid parameters)
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Server error

### Best Practices

1. **Always wrap service calls in try-catch blocks**
2. **Show user-friendly error messages**
3. **Log errors for debugging**
4. **Implement retry logic for transient failures**

```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

try {
  await reloadlyService.sendTopup(request);
  toast({
    title: 'Success',
    description: 'Topup completed successfully'
  });
} catch (error) {
  toast({
    title: 'Error',
    description: error instanceof Error ? error.message : 'Failed to send topup',
    variant: 'destructive'
  });
}
```

---

## Testing

### Sandbox Testing

1. **Use sandbox mode** for development:
   ```bash
   RELOADLY_ENV=sandbox
   ```

2. **Test credentials**: Use test credentials provided by Reloadly

3. **Test phone numbers**: Use Reloadly's test phone numbers (see documentation)

### Testing Checklist

- [ ] Test authentication and token caching
- [ ] Test operator listing and auto-detection
- [ ] Test airtime topup with various amounts
- [ ] Test gift card product listing
- [ ] Test gift card ordering
- [ ] Test biller listing by country
- [ ] Test bill payment
- [ ] Test webhook reception and signature verification
- [ ] Test error handling for various scenarios
- [ ] Test with production credentials (small amounts)

---

## API Reference

### Reloadly Service Methods

#### Authentication

```typescript
// Token is managed automatically, but you can clear cache if needed
reloadlyService.clearCache();
```

#### Airtime & Data

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getOperators()` | includeData?, includeBundles?, simplified? | `Promise<Operator[]>` | Get all operators |
| `getOperatorsByCountry()` | countryCode | `Promise<Operator[]>` | Get operators by country |
| `autoDetectOperator()` | phone, countryCode | `Promise<Operator>` | Auto-detect operator from phone |
| `getFxRate()` | operatorId, amount | `Promise<{fxRate, amount}>` | Get exchange rate |
| `sendTopup()` | TopupRequest | `Promise<TopupResponse>` | Send airtime topup |
| `getTopupTransaction()` | transactionId | `Promise<TopupResponse>` | Get topup details |

#### Gift Cards

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getGiftCardProducts()` | countryCode? | `Promise<GiftCardProduct[]>` | List gift card products |
| `getGiftCardProduct()` | productId | `Promise<GiftCardProduct>` | Get product details |
| `orderGiftCard()` | GiftCardOrderRequest | `Promise<GiftCardOrderResponse>` | Order gift card |
| `getGiftCardOrder()` | transactionId | `Promise<GiftCardOrderResponse>` | Get order details |
| `getRedeemInstructions()` | transactionId | `Promise<any>` | Get redeem codes |

#### Utility Bills

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getBillers()` | - | `Promise<Biller[]>` | List all billers |
| `getBillersByCountry()` | countryCode | `Promise<Biller[]>` | Get billers by country |
| `getBiller()` | billerId | `Promise<Biller>` | Get biller details |
| `payBill()` | BillPaymentRequest | `Promise<BillPaymentResponse>` | Pay bill |
| `getBillTransaction()` | transactionId | `Promise<BillPaymentResponse>` | Get payment details |
| `getBalance()` | - | `Promise<{balance, currencyCode, currencyName}>` | Get account balance |

---

## Additional Resources

- **Reloadly Documentation**: [https://docs.reloadly.com/](https://docs.reloadly.com/)
- **Reloadly Dashboard**: [https://www.reloadly.com/developers/](https://www.reloadly.com/developers/)
- **Integration Partners Config**: `/src/config/integration-partners.ts`
- **Reloadly Service**: `/src/services/reloadlyService.ts`
- **Webhook Handler**: `/src/app/api/webhooks/reloadly/route.ts`

---

## Support

For issues with the integration:
1. Check the Reloadly API status page
2. Review error logs for detailed error messages
3. Test with sandbox credentials first
4. Contact Reloadly support for API-specific issues

For code-related questions, refer to the inline documentation in the service files.
