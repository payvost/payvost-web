# Currency Service

Handles exchange rates, currency conversion, and forex operations for multi-currency support.

## Features

- Real-time exchange rates (with 5-minute cache)
- Currency conversion calculations
- Conversion fee estimation
- Support for 13 major currencies
- Tier-based conversion fees
- Rate caching for performance

## Supported Currencies

- **USD** - US Dollar
- **EUR** - Euro
- **GBP** - British Pound
- **NGN** - Nigerian Naira
- **GHS** - Ghanaian Cedi
- **KES** - Kenyan Shilling
- **ZAR** - South African Rand
- **JPY** - Japanese Yen
- **CAD** - Canadian Dollar
- **AUD** - Australian Dollar
- **CHF** - Swiss Franc
- **CNY** - Chinese Yuan
- **INR** - Indian Rupee

## API Endpoints

### Get Exchange Rates
```
GET /api/currency/rates?base=USD&target=EUR
Authentication: Optional
```

Returns current exchange rates.

**Query Parameters:**
- `base`: Base currency code (default: USD)
- `target`: Target currency code (optional, returns all if omitted)

**Response:**
```json
{
  "base": "USD",
  "timestamp": "2025-11-01T12:00:00Z",
  "rates": {
    "EUR": "0.92",
    "GBP": "0.79",
    "NGN": "1580.00"
  }
}
```

### Convert Currency
```
POST /api/currency/convert
Authentication: Optional
```

Convert amount from one currency to another.

**Request Body:**
```json
{
  "amount": 100,
  "from": "USD",
  "to": "EUR"
}
```

**Response:**
```json
{
  "amount": 100,
  "from": "USD",
  "to": "EUR",
  "convertedAmount": "92.00",
  "rate": "0.92",
  "timestamp": "2025-11-01T12:00:00Z"
}
```

### Get Supported Currencies
```
GET /api/currency/supported
Authentication: Not required
```

Returns list of all supported currencies with names and symbols.

### Calculate Conversion Fees
```
POST /api/currency/calculate-fees
Authentication: Required
```

Calculate fees for a currency conversion.

**Request Body:**
```json
{
  "amount": 100,
  "from": "USD",
  "to": "EUR",
  "userTier": "STANDARD"
}
```

**Response:**
```json
{
  "amount": 100,
  "from": "USD",
  "to": "EUR",
  "fees": "1.00",
  "breakdown": {
    "conversionFee": "1.00",
    "markup": "0.00",
    "discount": "0.00"
  },
  "effectiveRate": "0.9108"
}
```

## Fee Structure

### Conversion Fees (by User Tier)

- **STANDARD**: 1.0%
- **BUSINESS**: 0.75%
- **PREMIUM**: 0.5%
- **VIP**: 0.25% (with additional 10% discount)

### Example Calculation

For a $100 USD → EUR conversion (STANDARD tier):
- Base amount: $100
- Conversion fee (1%): $1.00
- Total cost: $101.00
- Amount received: €91.08 (at rate 0.9108)

## Caching Strategy

- Exchange rates are cached for 5 minutes
- Cache key format: `{base}-{target}` or `{base}-rates`
- In production, use Redis or similar for distributed caching

## Integration

The Currency Service integrates with:
- **Transaction Service**: Multi-currency transfers
- **Wallet Service**: Multi-currency accounts
- **Payment Service**: Cross-border payments
- **Fee Engine**: Currency conversion fees

## Future Enhancements

- Integration with external rate APIs (Fixer.io, ExchangeRate-API)
- Historical rate data
- Rate alerts and notifications
- Cryptocurrency support
- Advanced rate forecasting

