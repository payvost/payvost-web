# Fraud Detection & Compliance

Protect your platform with Payvost's built-in fraud detection and compliance tools.

## Overview

Payvost provides comprehensive fraud prevention and compliance features:
- **Real-time fraud detection**
- **AML (Anti-Money Laundering) screening**
- **Transaction monitoring**
- **Velocity checks and limits**
- **Risk scoring**
- **Suspicious activity reporting**
- **Compliance alerts**

## Fraud Detection

### Transaction Risk Scoring

Every transaction is automatically scored for fraud risk:

```javascript
// Node.js - Get risk assessment
const assessment = await payvost.fraud.assessTransaction({
  userId: 'usr_abc123',
  amount: '5000.00',
  currency: 'USD',
  type: 'transfer',
  recipient: {
    walletId: 'acc_xyz789'
  },
  metadata: {
    ipAddress: '203.0.113.42',
    deviceId: 'dev_123abc'
  }
});

console.log('Risk Score:', assessment.riskScore); // 0-100
console.log('Risk Level:', assessment.riskLevel); // 'low', 'medium', 'high'
console.log('Recommendation:', assessment.recommendation); // 'approve', 'review', 'block'
console.log('Factors:', assessment.factors);
```

```python
# Python
assessment = payvost.Fraud.assess_transaction(
    user_id='usr_abc123',
    amount='5000.00',
    currency='USD',
    type='transfer',
    recipient={'wallet_id': 'acc_xyz789'},
    metadata={
        'ip_address': '203.0.113.42',
        'device_id': 'dev_123abc'
    }
)

print(f'Risk Score: {assessment.risk_score}')
print(f'Risk Level: {assessment.risk_level}')
print(f'Recommendation: {assessment.recommendation}')
```

### Response

```json
{
  "success": true,
  "data": {
    "riskScore": 35,
    "riskLevel": "medium",
    "recommendation": "review",
    "factors": [
      {
        "type": "unusual_transaction_size",
        "severity": "medium",
        "description": "Transaction 3x larger than user's average"
      },
      {
        "type": "new_recipient",
        "severity": "low",
        "description": "First transaction to this recipient"
      }
    ],
    "checks": {
      "velocityCheck": "passed",
      "amountCheck": "warning",
      "recipientCheck": "passed",
      "geoCheck": "passed",
      "deviceCheck": "passed"
    }
  }
}
```

## Velocity Checks

Prevent rapid-fire transactions:

```javascript
// Node.js - Check velocity limits
const velocityCheck = await payvost.fraud.checkVelocity('usr_abc123', {
  type: 'transfer',
  amount: '1000.00'
});

if (!velocityCheck.allowed) {
  console.log('Transaction blocked:', velocityCheck.reason);
  console.log('Limits:', velocityCheck.limits);
  console.log('Try again at:', velocityCheck.retryAt);
}
```

### Response

```json
{
  "success": true,
  "data": {
    "allowed": false,
    "reason": "daily_transaction_limit_exceeded",
    "limits": {
      "daily": {
        "limit": 10,
        "used": 10,
        "remaining": 0,
        "resetsAt": "2025-11-02T00:00:00Z"
      },
      "hourly": {
        "limit": 5,
        "used": 5,
        "remaining": 0,
        "resetsAt": "2025-11-01T11:00:00Z"
      }
    },
    "retryAt": "2025-11-01T11:00:00Z"
  }
}
```

## Device Fingerprinting

Track and verify user devices:

```javascript
// Client-side - Generate device fingerprint
<script src="https://cdn.payvost.com/fingerprint.js"></script>
<script>
  const deviceId = await Payvost.generateFingerprint();
  
  // Include in API calls
  fetch('/api/transfer', {
    method: 'POST',
    headers: {
      'X-Device-Id': deviceId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ /* transfer data */ })
  });
</script>
```

```javascript
// Node.js - Verify device
const device = await payvost.fraud.verifyDevice('usr_abc123', {
  deviceId: 'dev_123abc',
  ipAddress: '203.0.113.42',
  userAgent: 'Mozilla/5.0...'
});

if (device.isTrusted) {
  // Proceed with transaction
} else {
  // Require additional verification
  console.log('New device detected:', device.location);
}
```

## IP Address Analysis

Analyze IP addresses for fraud indicators:

```javascript
// Node.js
const ipAnalysis = await payvost.fraud.analyzeIP('203.0.113.42');

console.log('Country:', ipAnalysis.country);
console.log('Is Proxy:', ipAnalysis.isProxy);
console.log('Is VPN:', ipAnalysis.isVPN);
console.log('Is Tor:', ipAnalysis.isTor);
console.log('Risk Score:', ipAnalysis.riskScore);

if (ipAnalysis.isHighRisk) {
  // Require additional verification
}
```

### Response

```json
{
  "success": true,
  "data": {
    "ip": "203.0.113.42",
    "country": "US",
    "city": "New York",
    "region": "NY",
    "isProxy": false,
    "isVPN": false,
    "isTor": false,
    "isHosting": false,
    "riskScore": 15,
    "isHighRisk": false,
    "threatLevel": "low"
  }
}
```

## Transaction Monitoring

### Create Monitoring Rules

```javascript
// Node.js
const rule = await payvost.fraud.createRule({
  name: 'Large Transaction Alert',
  type: 'transaction_amount',
  condition: {
    operator: 'greater_than',
    value: '10000.00',
    currency: 'USD'
  },
  actions: [
    {
      type: 'require_review',
      severity: 'high'
    },
    {
      type: 'notify_admin',
      channels: ['email', 'slack']
    }
  ],
  enabled: true
});

console.log('Rule ID:', rule.id);
```

### Common Rule Types

```javascript
// Multiple transactions in short time
{
  type: 'velocity',
  condition: {
    count: 5,
    timeWindow: 3600, // 1 hour
    amount: '1000.00'
  }
}

// Unusual transaction pattern
{
  type: 'pattern_deviation',
  condition: {
    deviationThreshold: 3.0, // 3x standard deviation
    metric: 'transaction_amount'
  }
}

// Geographic anomaly
{
  type: 'geographic',
  condition: {
    differentCountry: true,
    timeWindow: 3600 // Within 1 hour
  }
}

// High-risk country
{
  type: 'country_risk',
  condition: {
    countries: ['XX', 'YY'],
    action: 'block'
  }
}
```

## AML Screening

### Screen Users

```javascript
// Node.js
const screening = await payvost.compliance.screenUser('usr_abc123', {
  fullName: 'John Doe',
  dateOfBirth: '1990-01-15',
  country: 'US',
  checkAgainst: [
    'sanctions_lists',
    'pep_lists', // Politically Exposed Persons
    'watchlists',
    'adverse_media'
  ]
});

console.log('Status:', screening.status); // 'clear', 'potential_match', 'match'
console.log('Matches:', screening.matches);

if (screening.status === 'match') {
  console.log('Action required:', screening.recommendedAction);
}
```

### Response

```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123",
    "status": "potential_match",
    "riskLevel": "medium",
    "matches": [
      {
        "listType": "pep_list",
        "name": "John A. Doe",
        "matchScore": 85,
        "details": {
          "position": "Government Official",
          "country": "US",
          "lastUpdated": "2025-10-15"
        }
      }
    ],
    "recommendedAction": "enhanced_due_diligence",
    "screenedAt": "2025-11-01T10:00:00Z"
  }
}
```

### Screen Transactions

```javascript
// Node.js
const txScreening = await payvost.compliance.screenTransaction({
  transactionId: 'txn_abc123',
  sender: {
    userId: 'usr_sender',
    country: 'US'
  },
  recipient: {
    userId: 'usr_recipient',
    country: 'NG'
  },
  amount: '50000.00',
  currency: 'USD'
});

if (txScreening.requiresReview) {
  // Hold transaction for review
  console.log('Review reason:', txScreening.reason);
}
```

## Suspicious Activity Reports (SAR)

### Create SAR

```javascript
// Node.js
const sar = await payvost.compliance.createSAR({
  userId: 'usr_abc123',
  type: 'unusual_transaction_pattern',
  severity: 'high',
  description: 'User made 10 large transactions to different recipients in 1 hour',
  transactions: [
    'txn_001', 'txn_002', 'txn_003'
  ],
  evidence: [
    {
      type: 'transaction_logs',
      url: 'https://files.payvost.com/evidence/logs_123.pdf'
    }
  ],
  investigator: 'admin_xyz'
});

console.log('SAR ID:', sar.id);
console.log('Status:', sar.status); // 'pending_review', 'under_investigation', 'reported'
```

### List SARs

```javascript
// Node.js
const sars = await payvost.compliance.listSARs({
  status: 'pending_review',
  severity: 'high',
  startDate: '2025-10-01',
  endDate: '2025-10-31'
});

sars.data.forEach(sar => {
  console.log(`${sar.id}: ${sar.type} - ${sar.severity}`);
});
```

## Compliance Alerts

### Get Compliance Alerts

```javascript
// Node.js
const alerts = await payvost.compliance.getAlerts({
  status: 'active',
  severity: ['high', 'critical'],
  limit: 50
});

alerts.data.forEach(alert => {
  console.log(`${alert.type}: ${alert.description}`);
  console.log('Affected users:', alert.affectedUsers.length);
});
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "alert_abc123",
      "type": "velocity_limit_exceeded",
      "severity": "high",
      "userId": "usr_xyz789",
      "description": "User exceeded hourly transaction limit",
      "detectedAt": "2025-11-01T10:00:00Z",
      "status": "active",
      "metadata": {
        "transactions": ["txn_001", "txn_002"],
        "limit": 5,
        "actual": 10
      },
      "recommendedActions": [
        "review_transactions",
        "contact_user",
        "temporarily_freeze_account"
      ]
    }
  ]
}
```

### Resolve Alert

```javascript
// Node.js
await payvost.compliance.resolveAlert('alert_abc123', {
  resolution: 'false_positive',
  notes: 'Legitimate business activity, user runs e-commerce store',
  resolvedBy: 'admin_xyz'
});
```

## Account Actions

### Freeze Account

```javascript
// Node.js
await payvost.fraud.freezeAccount('usr_abc123', {
  reason: 'suspicious_activity',
  description: 'Multiple failed login attempts from different locations',
  duration: 'indefinite', // or specific duration in seconds
  notifyUser: true
});
```

### Review Queue

```javascript
// Node.js
const reviewQueue = await payvost.fraud.getReviewQueue({
  status: 'pending',
  priority: 'high',
  limit: 20
});

reviewQueue.data.forEach(item => {
  console.log(`${item.type}: ${item.description}`);
  console.log('Priority:', item.priority);
  console.log('Created:', item.createdAt);
});
```

### Approve/Reject Transactions

```javascript
// Node.js - Approve
await payvost.fraud.approveTransaction('txn_abc123', {
  reviewedBy: 'admin_xyz',
  notes: 'Verified with customer via phone'
});

// Node.js - Reject
await payvost.fraud.rejectTransaction('txn_abc123', {
  reason: 'fraudulent_activity',
  reviewedBy: 'admin_xyz',
  notes: 'Card reported stolen',
  refund: true
});
```

## Custom Risk Rules

### Create Custom Rule

```javascript
// Node.js
const customRule = await payvost.fraud.createCustomRule({
  name: 'High-Value New User',
  description: 'Flag transactions over $1000 from users registered < 7 days',
  conditions: [
    {
      field: 'user.accountAge',
      operator: 'less_than',
      value: 7,
      unit: 'days'
    },
    {
      field: 'transaction.amount',
      operator: 'greater_than',
      value: 1000,
      currency: 'USD'
    }
  ],
  actions: [
    {
      type: 'require_manual_review',
      priority: 'high'
    },
    {
      type: 'limit_transaction',
      maxAmount: '500.00'
    }
  ],
  enabled: true
});
```

## Whitelist/Blacklist Management

### Add to Whitelist

```javascript
// Node.js
await payvost.fraud.addToWhitelist({
  type: 'user',
  entityId: 'usr_abc123',
  reason: 'Verified premium customer',
  expiresAt: '2026-11-01T00:00:00Z'
});

// Whitelist IP address
await payvost.fraud.addToWhitelist({
  type: 'ip',
  value: '203.0.113.42',
  reason: 'Corporate office IP'
});
```

### Add to Blacklist

```javascript
// Node.js
await payvost.fraud.addToBlacklist({
  type: 'user',
  entityId: 'usr_xyz789',
  reason: 'Confirmed fraudulent activity',
  severity: 'permanent'
});

// Blacklist email domain
await payvost.fraud.addToBlacklist({
  type: 'email_domain',
  value: 'suspicious-domain.com',
  reason: 'Known fraud source'
});
```

## Reporting

### Generate Compliance Report

```javascript
// Node.js
const report = await payvost.compliance.generateReport({
  type: 'suspicious_activity',
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  format: 'pdf', // or 'csv', 'xlsx'
  includeDetails: true
});

console.log('Report URL:', report.downloadUrl);
```

### Get Fraud Statistics

```javascript
// Node.js
const stats = await payvost.fraud.getStatistics({
  period: '30d',
  metrics: [
    'total_alerts',
    'blocked_transactions',
    'false_positives',
    'fraud_prevented_amount'
  ]
});

console.log('Alerts:', stats.totalAlerts);
console.log('Blocked:', stats.blockedTransactions);
console.log('False Positives:', stats.falsePositives);
console.log('Fraud Prevented:', stats.fraudPreventedAmount);
```

## Webhooks

Receive fraud and compliance events:

```javascript
// Node.js webhook handler
app.post('/webhooks/fraud', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'fraud.alert_created':
      // High-priority fraud alert
      notifySecurityTeam(event.data);
      break;
      
    case 'fraud.transaction_blocked':
      // Transaction blocked by fraud system
      logBlockedTransaction(event.data);
      notifyUser(event.data.userId, 'transaction_blocked');
      break;
      
    case 'compliance.sar_created':
      // New suspicious activity report
      notifyComplianceOfficer(event.data);
      break;
      
    case 'compliance.screening_match':
      // AML screening found match
      escalateToCompliance(event.data);
      break;
  }
  
  res.json({ received: true });
});
```

## Best Practices

1. **Monitor Regularly**: Review fraud alerts and compliance reports daily
2. **Act Quickly**: Respond to high-severity alerts within minutes
3. **Document Everything**: Keep detailed notes on all investigations
4. **Update Rules**: Regularly review and adjust fraud rules
5. **Train Staff**: Ensure team understands fraud patterns
6. **Balance Security**: Don't be too aggressive; avoid false positives
7. **Communicate**: Notify users when their accounts are flagged
8. **Stay Compliant**: Keep up with AML/KYC regulations

## Error Handling

```javascript
try {
  const assessment = await payvost.fraud.assessTransaction({
    userId: 'usr_abc123',
    amount: '5000.00'
  });
} catch (error) {
  switch(error.code) {
    case 'user_blacklisted':
      console.error('User is on blacklist');
      break;
      
    case 'high_risk_transaction':
      console.error('Transaction blocked due to high risk');
      console.error('Risk score:', error.riskScore);
      break;
      
    case 'velocity_limit_exceeded':
      console.error('Velocity limit exceeded');
      console.error('Retry at:', error.retryAt);
      break;
      
    default:
      console.error('Fraud check error:', error.message);
  }
}
```

## Next Steps

- **[User Management & KYC](./06-user-management-kyc.md)** - KYC verification
- **[Webhooks](./08-webhook-notifications.md)** - Fraud event notifications
- **[Transaction Reporting](./10-transaction-reporting.md)** - Compliance reporting
