# Currency Exchange Integration

Access real-time exchange rates and perform currency conversions.

## Overview

Payvost's Currency Exchange API provides:
- **Real-time exchange rates for 150+ currencies**
- **Historical exchange rate data**
- **Currency conversion**
- **Rate alerts and notifications**
- **Competitive exchange rates with transparent pricing**

## Supported Currencies

Payvost supports major global currencies including:
- **Fiat currencies**: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, etc.
- **African currencies**: NGN, GHS, KES, ZAR, UGX, TZS, ZMW, etc.
- **Asian currencies**: INR, PHP, THB, IDR, VND, MYR, etc.
- **Latin American currencies**: BRL, MXN, ARS, CLP, COP, PEN, etc.
- **Cryptocurrencies**: BTC, ETH, USDT, USDC (selected pairs)

## Get Exchange Rates

### Get Current Rate

```javascript
// Node.js
const rate = await payvost.exchange.getRate({
  from: 'USD',
  to: 'EUR'
});

console.log('Exchange Rate:', rate.rate);
console.log('Inverse Rate:', rate.inverseRate);
console.log('Last Updated:', rate.updatedAt);
```

```python
# Python
rate = payvost.Exchange.get_rate(
    from_currency='USD',
    to_currency='EUR'
)

print(f'Exchange Rate: {rate.rate}')
print(f'Inverse Rate: {rate.inverse_rate}')
print(f'Last Updated: {rate.updated_at}')
```

```bash
# cURL
curl "https://api.payvost.com/v1/exchange/rates?from=USD&to=EUR" \
  -H "Authorization: Bearer sk_live_your_key"
```

### Response

```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "EUR",
    "rate": "0.92145",
    "inverseRate": "1.08525",
    "bid": "0.92100",
    "ask": "0.92190",
    "spread": "0.00090",
    "updatedAt": "2025-11-01T10:00:00Z",
    "source": "interbank"
  }
}
```

### Get Multiple Rates

```javascript
// Node.js
const rates = await payvost.exchange.getRates({
  base: 'USD',
  currencies: ['EUR', 'GBP', 'JPY', 'NGN', 'KES']
});

Object.entries(rates.rates).forEach(([currency, rate]) => {
  console.log(`USD to ${currency}: ${rate}`);
});
```

```python
# Python
rates = payvost.Exchange.get_rates(
    base='USD',
    currencies=['EUR', 'GBP', 'JPY', 'NGN', 'KES']
)

for currency, rate in rates.rates.items():
    print(f'USD to {currency}: {rate}')
```

```bash
# cURL
curl "https://api.payvost.com/v1/exchange/rates?base=USD&currencies=EUR,GBP,JPY,NGN,KES" \
  -H "Authorization: Bearer sk_live_your_key"
```

### Response

```json
{
  "success": true,
  "data": {
    "base": "USD",
    "rates": {
      "EUR": "0.92145",
      "GBP": "0.79830",
      "JPY": "149.52",
      "NGN": "1580.50",
      "KES": "129.45"
    },
    "updatedAt": "2025-11-01T10:00:00Z"
  }
}
```

## Currency Conversion

### Convert Amount

```javascript
// Node.js
const conversion = await payvost.exchange.convert({
  from: 'USD',
  to: 'EUR',
  amount: '1000.00'
});

console.log('Input Amount:', conversion.fromAmount);
console.log('Converted Amount:', conversion.toAmount);
console.log('Exchange Rate:', conversion.rate);
console.log('Fee:', conversion.fee);
console.log('Total Cost:', conversion.totalCost);
```

```python
# Python
conversion = payvost.Exchange.convert(
    from_currency='USD',
    to_currency='EUR',
    amount='1000.00'
)

print(f'Input Amount: {conversion.from_amount}')
print(f'Converted Amount: {conversion.to_amount}')
print(f'Exchange Rate: {conversion.rate}')
print(f'Fee: {conversion.fee}')
```

```bash
# cURL
curl "https://api.payvost.com/v1/exchange/convert?from=USD&to=EUR&amount=1000.00" \
  -H "Authorization: Bearer sk_live_your_key"
```

### Response

```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "EUR",
    "fromAmount": "1000.00",
    "toAmount": "921.45",
    "rate": "0.92145",
    "fee": "2.50",
    "feePercentage": "0.25",
    "totalCost": "1002.50",
    "timestamp": "2025-11-01T10:00:00Z"
  }
}
```

## Historical Exchange Rates

### Get Historical Rate

```javascript
// Node.js
const historicalRate = await payvost.exchange.getHistoricalRate({
  from: 'USD',
  to: 'EUR',
  date: '2025-10-01'
});

console.log('Rate on 2025-10-01:', historicalRate.rate);
```

### Get Rate History

```javascript
// Node.js
const history = await payvost.exchange.getRateHistory({
  from: 'USD',
  to: 'EUR',
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  interval: 'daily' // 'hourly', 'daily', 'weekly', 'monthly'
});

history.data.forEach(point => {
  console.log(`${point.date}: ${point.rate}`);
});
```

```python
# Python
history = payvost.Exchange.get_rate_history(
    from_currency='USD',
    to_currency='EUR',
    start_date='2025-10-01',
    end_date='2025-10-31',
    interval='daily'
)

for point in history.data:
    print(f'{point.date}: {point.rate}')
```

```bash
# cURL
curl "https://api.payvost.com/v1/exchange/history?from=USD&to=EUR&startDate=2025-10-01&endDate=2025-10-31&interval=daily" \
  -H "Authorization: Bearer sk_live_your_key"
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-10-01",
      "rate": "0.91850",
      "high": "0.92100",
      "low": "0.91600",
      "volume": "125000000"
    },
    {
      "date": "2025-10-02",
      "rate": "0.92000",
      "high": "0.92250",
      "low": "0.91800",
      "volume": "130000000"
    }
  ]
}
```

## Rate Alerts

### Create Rate Alert

```javascript
// Node.js
const alert = await payvost.exchange.createAlert({
  from: 'USD',
  to: 'EUR',
  condition: 'above', // or 'below'
  targetRate: '0.95',
  notificationMethod: 'email', // 'email', 'sms', 'webhook'
  expiresAt: '2025-12-31T23:59:59Z'
});

console.log('Alert ID:', alert.id);
console.log('Target Rate:', alert.targetRate);
```

```python
# Python
alert = payvost.Exchange.create_alert(
    from_currency='USD',
    to_currency='EUR',
    condition='above',
    target_rate='0.95',
    notification_method='email',
    expires_at='2025-12-31T23:59:59Z'
)

print(f'Alert ID: {alert.id}')
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "alert_abc123",
    "from": "USD",
    "to": "EUR",
    "condition": "above",
    "targetRate": "0.95",
    "currentRate": "0.92145",
    "notificationMethod": "email",
    "status": "active",
    "createdAt": "2025-11-01T10:00:00Z",
    "expiresAt": "2025-12-31T23:59:59Z"
  }
}
```

### List Rate Alerts

```javascript
// Node.js
const alerts = await payvost.exchange.listAlerts({
  status: 'active'
});

alerts.data.forEach(alert => {
  console.log(`${alert.from}/${alert.to}: ${alert.condition} ${alert.targetRate}`);
});
```

### Delete Rate Alert

```javascript
// Node.js
await payvost.exchange.deleteAlert('alert_abc123');
```

## Supported Currency Pairs

### Get All Supported Pairs

```javascript
// Node.js
const pairs = await payvost.exchange.getSupportedPairs();

console.log('Total pairs:', pairs.totalPairs);
pairs.data.forEach(pair => {
  console.log(`${pair.from}/${pair.to}: ${pair.rate}`);
});
```

```bash
# cURL
curl https://api.payvost.com/v1/exchange/pairs \
  -H "Authorization: Bearer sk_live_your_key"
```

### Check Pair Support

```javascript
// Node.js
const isSupported = await payvost.exchange.isPairSupported('USD', 'NGN');

if (isSupported) {
  console.log('USD/NGN is supported');
}
```

## Live Rate Streaming

### WebSocket Connection

```javascript
// Node.js with WebSocket
const WebSocket = require('ws');

const ws = new WebSocket('wss://stream.payvost.com/v1/exchange', {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

ws.on('open', () => {
  // Subscribe to rate updates
  ws.send(JSON.stringify({
    action: 'subscribe',
    pairs: ['USD/EUR', 'USD/NGN', 'USD/KES']
  }));
});

ws.on('message', (data) => {
  const update = JSON.parse(data);
  console.log(`${update.pair}: ${update.rate}`);
});
```

```python
# Python with websockets
import websockets
import json
import asyncio

async def stream_rates():
    uri = "wss://stream.payvost.com/v1/exchange"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    async with websockets.connect(uri, extra_headers=headers) as websocket:
        # Subscribe to rate updates
        await websocket.send(json.dumps({
            "action": "subscribe",
            "pairs": ["USD/EUR", "USD/NGN", "USD/KES"]
        }))
        
        async for message in websocket:
            update = json.loads(message)
            print(f"{update['pair']}: {update['rate']}")

asyncio.run(stream_rates())
```

## Exchange Rate Fees

### Get Fee Structure

```javascript
// Node.js
const fees = await payvost.exchange.getFees({
  from: 'USD',
  to: 'EUR',
  amount: '1000.00'
});

console.log('Base Fee:', fees.baseFee);
console.log('Percentage Fee:', fees.percentageFee);
console.log('Total Fee:', fees.totalFee);
console.log('Effective Rate:', fees.effectiveRate);
```

### Response

```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "EUR",
    "amount": "1000.00",
    "marketRate": "0.92145",
    "baseFee": "1.00",
    "percentageFee": "0.25",
    "totalFee": "2.50",
    "effectiveRate": "0.91895",
    "amountAfterFees": "918.95"
  }
}
```

## Currency Information

### Get Currency Details

```javascript
// Node.js
const currency = await payvost.exchange.getCurrencyInfo('USD');

console.log('Name:', currency.name);
console.log('Symbol:', currency.symbol);
console.log('Decimal Places:', currency.decimalPlaces);
console.log('Countries:', currency.countries);
```

### Response

```json
{
  "success": true,
  "data": {
    "code": "USD",
    "name": "United States Dollar",
    "symbol": "$",
    "decimalPlaces": 2,
    "countries": ["US", "EC", "SV", "PA", "ZW"],
    "type": "fiat",
    "active": true
  }
}
```

### List All Currencies

```javascript
// Node.js
const currencies = await payvost.exchange.listCurrencies({
  type: 'fiat', // 'fiat', 'crypto', 'all'
  active: true
});

currencies.data.forEach(currency => {
  console.log(`${currency.code}: ${currency.name}`);
});
```

## Exchange Analytics

### Get Market Statistics

```javascript
// Node.js
const stats = await payvost.exchange.getStatistics({
  pair: 'USD/EUR',
  period: '24h' // '1h', '24h', '7d', '30d'
});

console.log('High:', stats.high);
console.log('Low:', stats.low);
console.log('Average:', stats.average);
console.log('Volume:', stats.volume);
console.log('Volatility:', stats.volatility);
```

### Response

```json
{
  "success": true,
  "data": {
    "pair": "USD/EUR",
    "period": "24h",
    "high": "0.92500",
    "low": "0.91800",
    "average": "0.92150",
    "open": "0.92000",
    "close": "0.92145",
    "volume": "1250000000",
    "volatility": "0.76",
    "change": "+0.15",
    "changePercent": "+0.16"
  }
}
```

## Rate Locking

### Lock Exchange Rate

For guaranteed rates on future conversions:

```javascript
// Node.js
const lockedRate = await payvost.exchange.lockRate({
  from: 'USD',
  to: 'EUR',
  amount: '10000.00',
  duration: 3600 // Lock for 1 hour (in seconds)
});

console.log('Locked Rate ID:', lockedRate.id);
console.log('Rate:', lockedRate.rate);
console.log('Expires at:', lockedRate.expiresAt);

// Use locked rate for conversion
const conversion = await payvost.exchange.convert({
  from: 'USD',
  to: 'EUR',
  amount: '10000.00',
  lockedRateId: lockedRate.id
});
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "lock_abc123",
    "from": "USD",
    "to": "EUR",
    "rate": "0.92145",
    "amount": "10000.00",
    "lockedAt": "2025-11-01T10:00:00Z",
    "expiresAt": "2025-11-01T11:00:00Z",
    "status": "active"
  }
}
```

## Webhooks

Subscribe to exchange rate events:

```javascript
// Node.js webhook handler
app.post('/webhooks/exchange', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'rate.updated':
      console.log(`${event.data.pair}: ${event.data.rate}`);
      break;
      
    case 'rate.alert_triggered':
      console.log('Rate alert triggered:', event.data.alertId);
      console.log(`${event.data.from}/${event.data.to}: ${event.data.currentRate}`);
      // Notify user or execute trade
      break;
      
    case 'rate.significant_change':
      console.log('Significant rate change:', event.data.pair);
      console.log('Change:', event.data.changePercent);
      break;
  }
  
  res.json({ received: true });
});
```

## Error Handling

```javascript
try {
  const rate = await payvost.exchange.getRate({
    from: 'USD',
    to: 'XYZ'
  });
} catch (error) {
  switch(error.code) {
    case 'unsupported_currency':
      console.error('Currency not supported:', error.currency);
      break;
      
    case 'unsupported_pair':
      console.error('Currency pair not supported');
      break;
      
    case 'rate_unavailable':
      console.error('Exchange rate temporarily unavailable');
      break;
      
    case 'locked_rate_expired':
      console.error('Locked rate has expired');
      break;
      
    default:
      console.error('Exchange error:', error.message);
  }
}
```

## Best Practices

1. **Cache Rates**: Cache exchange rates for 60 seconds to reduce API calls
2. **Use Locked Rates**: Lock rates for large transactions
3. **Monitor Alerts**: Set up rate alerts for important currency pairs
4. **Handle Volatility**: Account for rate changes in your UI
5. **Display Fees**: Always show exchange fees transparently
6. **Update Frequently**: Refresh rates in real-time for trading applications
7. **Fallback Sources**: Have backup rate sources for critical applications

## Next Steps

- **[Transfer & Remittance](./05-transfer-remittance.md)** - Use rates for international transfers
- **[Wallet Integration](./03-wallet-integration.md)** - Multi-currency wallets
- **[Webhooks](./08-webhook-notifications.md)** - Real-time rate notifications
