# Fraud Detection Service

Monitors transactions for suspicious activity, calculates risk scores, and manages compliance alerts.

## Features

- Real-time transaction risk analysis
- Account-level risk scoring
- Compliance alert management
- Transaction velocity monitoring
- Pattern detection and anomaly analysis
- KYC verification checks

## API Endpoints

### Analyze Transaction
```
POST /api/fraud/analyze-transaction
Authentication: Required
```

Analyzes a transaction for fraud risk before execution.

**Request Body:**
```json
{
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "amount": 1000.00,
  "currency": "USD"
}
```

**Response:**
```json
{
  "riskScore": 45,
  "riskLevel": "MEDIUM",
  "factors": [
    "Elevated transaction velocity",
    "New recipient"
  ],
  "recommendation": "Monitor closely and consider additional checks"
}
```

### Get Compliance Alerts
```
GET /api/fraud/alerts?status=PENDING&severity=HIGH&limit=50&offset=0
Authentication: Required (Admin only)
```

Returns compliance alerts for admin review.

### Resolve Alert
```
POST /api/fraud/alerts/:id/resolve
Authentication: Required (Admin only)
```

Marks a compliance alert as resolved.

**Request Body:**
```json
{
  "resolution": "Verified with user, transaction legitimate"
}
```

### Get Account Risk Score
```
GET /api/fraud/risk-score/:accountId
Authentication: Required
```

Returns the overall risk score for an account.

## Risk Scoring Logic

### Transaction Risk Factors

**Transaction Velocity** (0-30 points)
- \> 5 transactions in 1 hour: +30 points
- 3-5 transactions in 1 hour: +15 points

**Unusual Amount** (0-40 points)
- \> 10x average transaction: +40 points
- \> 5x average transaction: +20 points

**New Recipient** (10 points)
- First time sending to this account: +10 points

**Account Age** (0-25 points)
- < 7 days old: +25 points
- < 30 days old: +10 points

**KYC Status** (30 points)
- Not verified: +30 points

### Risk Levels

- **LOW** (0-29): Proceed with transaction
- **MEDIUM** (30-49): Monitor closely
- **HIGH** (50-79): Require additional verification
- **CRITICAL** (80+): Block and flag for manual review

### Automated Actions

- **Score ≥ 50**: Create compliance alert automatically
- **Score ≥ 80**: Transaction blocked pending manual review

## Account Risk Scoring

Evaluates overall account health:

- Account age
- KYC verification status
- Transaction failure rate
- Pending compliance alerts
- Historical patterns

## Integration

The Fraud Service integrates with:
- **Transaction Service**: Pre-transaction risk analysis
- **Wallet Service**: Account-level monitoring
- **User Service**: KYC status verification
- **Notification Service**: Alert notifications (future)

