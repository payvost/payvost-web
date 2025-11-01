# Transaction Reporting & Analytics

Access comprehensive reporting and analytics for your transactions, payments, and transfers.

## Overview

Payvost's Reporting API provides:
- **Transaction history and export**
- **Financial reports and statements**
- **Analytics and insights**
- **Custom reports**
- **Real-time dashboards**
- **Reconciliation tools**

## Transaction Reports

### Get Transaction History

```javascript
// Node.js
const transactions = await payvost.reports.getTransactions({
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  type: 'all', // 'payment', 'transfer', 'refund', 'all'
  status: 'succeeded',
  currency: 'USD',
  limit: 100,
  offset: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

console.log('Total transactions:', transactions.total);
console.log('Total volume:', transactions.totalVolume);

transactions.data.forEach(tx => {
  console.log(`${tx.id}: ${tx.amount} ${tx.currency} - ${tx.status}`);
});
```

```python
# Python
transactions = payvost.Report.get_transactions(
    start_date='2025-10-01',
    end_date='2025-10-31',
    type='all',
    status='succeeded',
    currency='USD',
    limit=100,
    offset=0
)

print(f'Total transactions: {transactions.total}')
print(f'Total volume: {transactions.total_volume}')

for tx in transactions.data:
    print(f'{tx.id}: {tx.amount} {tx.currency} - {tx.status}')
```

```bash
# cURL
curl "https://api.payvost.com/v1/reports/transactions?startDate=2025-10-01&endDate=2025-10-31&status=succeeded" \
  -H "Authorization: Bearer sk_live_your_key"
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "txn_abc123",
      "type": "transfer",
      "amount": "500.00",
      "currency": "USD",
      "status": "succeeded",
      "fee": "2.50",
      "fromWalletId": "acc_sender",
      "toWalletId": "acc_recipient",
      "description": "Monthly payment",
      "createdAt": "2025-10-15T10:00:00Z",
      "completedAt": "2025-10-15T10:00:05Z"
    }
  ],
  "summary": {
    "total": 245,
    "totalVolume": "125000.00",
    "totalFees": "625.00",
    "successRate": "98.5"
  },
  "pagination": {
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

## Export Transactions

### Export to CSV/Excel

```javascript
// Node.js
const exportJob = await payvost.reports.exportTransactions({
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  format: 'csv', // 'csv', 'xlsx', 'pdf'
  filters: {
    type: 'transfer',
    status: 'succeeded',
    currency: 'USD'
  },
  columns: [
    'id',
    'date',
    'type',
    'amount',
    'currency',
    'fee',
    'status',
    'description',
    'fromWallet',
    'toWallet'
  ]
});

console.log('Export ID:', exportJob.id);
console.log('Status:', exportJob.status);

// Check export status
const status = await payvost.reports.getExportStatus(exportJob.id);
if (status.status === 'completed') {
  console.log('Download URL:', status.downloadUrl);
}
```

```python
# Python
export_job = payvost.Report.export_transactions(
    start_date='2025-10-01',
    end_date='2025-10-31',
    format='csv',
    filters={
        'type': 'transfer',
        'status': 'succeeded',
        'currency': 'USD'
    }
)

print(f'Export ID: {export_job.id}')

# Wait for completion
import time
while True:
    status = payvost.Report.get_export_status(export_job.id)
    if status.status == 'completed':
        print(f'Download URL: {status.download_url}')
        break
    time.sleep(5)
```

## Financial Statements

### Generate Account Statement

```javascript
// Node.js
const statement = await payvost.reports.generateStatement({
  walletId: 'acc_abc123',
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  format: 'pdf',
  includeDetails: true
});

console.log('Statement URL:', statement.downloadUrl);
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "stmt_abc123",
    "walletId": "acc_abc123",
    "currency": "USD",
    "period": {
      "start": "2025-10-01T00:00:00Z",
      "end": "2025-10-31T23:59:59Z"
    },
    "openingBalance": "10000.00",
    "closingBalance": "12500.00",
    "totalCredits": "5000.00",
    "totalDebits": "2500.00",
    "totalFees": "50.00",
    "transactionCount": 48,
    "downloadUrl": "https://files.payvost.com/statements/stmt_abc123.pdf",
    "expiresAt": "2025-11-08T00:00:00Z"
  }
}
```

### Monthly Reconciliation Report

```javascript
// Node.js
const reconciliation = await payvost.reports.getReconciliation({
  month: '2025-10',
  walletIds: ['acc_abc123', 'acc_def456'],
  includeBreakdown: true
});

console.log('Total transactions:', reconciliation.totalTransactions);
console.log('Total volume:', reconciliation.totalVolume);
console.log('Discrepancies:', reconciliation.discrepancies.length);
```

## Analytics

### Get Transaction Analytics

```javascript
// Node.js
const analytics = await payvost.analytics.getTransactions({
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  groupBy: 'day', // 'hour', 'day', 'week', 'month'
  metrics: [
    'volume',
    'count',
    'average_amount',
    'fees',
    'success_rate'
  ]
});

analytics.data.forEach(point => {
  console.log(`${point.date}: ${point.volume} (${point.count} txs)`);
});
```

```python
# Python
analytics = payvost.Analytics.get_transactions(
    start_date='2025-10-01',
    end_date='2025-10-31',
    group_by='day',
    metrics=['volume', 'count', 'average_amount', 'fees', 'success_rate']
)

for point in analytics.data:
    print(f'{point.date}: {point.volume} ({point.count} txs)')
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-10-01",
      "volume": "125000.00",
      "count": 245,
      "averageAmount": "510.20",
      "fees": "625.00",
      "successRate": "98.5"
    },
    {
      "date": "2025-10-02",
      "volume": "142000.00",
      "count": 278,
      "averageAmount": "510.79",
      "fees": "710.00",
      "successRate": "97.8"
    }
  ],
  "summary": {
    "totalVolume": "3875000.00",
    "totalCount": 7592,
    "averageAmount": "510.35",
    "totalFees": "19375.00",
    "overallSuccessRate": "98.2"
  }
}
```

### Payment Method Analytics

```javascript
// Node.js
const paymentAnalytics = await payvost.analytics.getPaymentMethods({
  startDate: '2025-10-01',
  endDate: '2025-10-31'
});

paymentAnalytics.data.forEach(method => {
  console.log(`${method.type}: ${method.volume} (${method.percentage}%)`);
});
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "type": "card",
      "volume": "1250000.00",
      "count": 3245,
      "percentage": "45.2",
      "averageAmount": "385.14",
      "successRate": "97.5"
    },
    {
      "type": "bank_transfer",
      "volume": "980000.00",
      "count": 1567,
      "percentage": "35.4",
      "averageAmount": "625.24",
      "successRate": "99.1"
    },
    {
      "type": "mobile_money",
      "volume": "535000.00",
      "count": 2134,
      "percentage": "19.4",
      "averageAmount": "250.70",
      "successRate": "96.8"
    }
  ]
}
```

## User Analytics

### Get User Statistics

```javascript
// Node.js
const userStats = await payvost.analytics.getUserStats({
  userId: 'usr_abc123',
  startDate: '2025-10-01',
  endDate: '2025-10-31'
});

console.log('Total transactions:', userStats.totalTransactions);
console.log('Total spent:', userStats.totalSpent);
console.log('Total received:', userStats.totalReceived);
console.log('Most used currency:', userStats.mostUsedCurrency);
console.log('Average transaction:', userStats.averageTransaction);
```

### Top Users Report

```javascript
// Node.js
const topUsers = await payvost.analytics.getTopUsers({
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  sortBy: 'volume', // 'volume', 'count', 'fees'
  limit: 100
});

topUsers.data.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name}: ${user.volume}`);
});
```

## Currency Analytics

### Get Currency Distribution

```javascript
// Node.js
const currencyStats = await payvost.analytics.getCurrencies({
  startDate: '2025-10-01',
  endDate: '2025-10-31'
});

currencyStats.data.forEach(currency => {
  console.log(`${currency.code}: ${currency.volume} (${currency.percentage}%)`);
});
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "code": "USD",
      "volume": "1875000.00",
      "count": 4521,
      "percentage": "48.4",
      "averageAmount": "414.69"
    },
    {
      "code": "EUR",
      "volume": "985000.00",
      "count": 2134,
      "percentage": "25.4",
      "averageAmount": "461.62"
    },
    {
      "code": "GBP",
      "volume": "645000.00",
      "count": 1456,
      "percentage": "16.6",
      "averageAmount": "443.13"
    }
  ]
}
```

## Geographic Analytics

### Get Geographic Distribution

```javascript
// Node.js
const geoStats = await payvost.analytics.getGeographic({
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  metric: 'volume' // 'volume', 'count', 'users'
});

geoStats.data.forEach(country => {
  console.log(`${country.name}: ${country.volume}`);
});
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "countryCode": "US",
      "countryName": "United States",
      "volume": "1250000.00",
      "count": 3245,
      "users": 892,
      "percentage": "32.3"
    },
    {
      "countryCode": "GB",
      "countryName": "United Kingdom",
      "volume": "875000.00",
      "count": 2134,
      "users": 567,
      "percentage": "22.6"
    }
  ]
}
```

## Custom Reports

### Create Custom Report

```javascript
// Node.js
const customReport = await payvost.reports.createCustom({
  name: 'Weekly Performance Report',
  description: 'Weekly transaction performance by payment method',
  schedule: 'weekly', // 'daily', 'weekly', 'monthly'
  recipients: ['admin@example.com', 'finance@example.com'],
  format: 'pdf',
  template: {
    sections: [
      {
        type: 'summary',
        metrics: ['volume', 'count', 'fees', 'success_rate']
      },
      {
        type: 'breakdown',
        groupBy: 'payment_method',
        metrics: ['volume', 'count']
      },
      {
        type: 'chart',
        chartType: 'line',
        metric: 'volume',
        groupBy: 'day'
      }
    ]
  }
});

console.log('Report ID:', customReport.id);
```

### Run Custom Report

```javascript
// Node.js
const report = await payvost.reports.runCustom('report_abc123', {
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  parameters: {
    currency: 'USD',
    minAmount: '100.00'
  }
});

console.log('Report URL:', report.downloadUrl);
```

## Real-Time Dashboard Data

### Get Dashboard Metrics

```javascript
// Node.js
const dashboard = await payvost.analytics.getDashboard({
  period: '24h', // '1h', '24h', '7d', '30d'
  metrics: [
    'current_balance',
    'pending_transfers',
    'active_users',
    'transaction_volume',
    'success_rate'
  ]
});

console.log('Current Balance:', dashboard.currentBalance);
console.log('Pending Transfers:', dashboard.pendingTransfers);
console.log('Active Users:', dashboard.activeUsers);
console.log('Transaction Volume:', dashboard.transactionVolume);
console.log('Success Rate:', dashboard.successRate);
```

### Response

```json
{
  "success": true,
  "data": {
    "currentBalance": "2500000.00",
    "pendingTransfers": 45,
    "activeUsers": 1234,
    "transactionVolume": {
      "value": "125000.00",
      "change": "+12.5",
      "trend": "up"
    },
    "successRate": {
      "value": "98.2",
      "change": "+0.5",
      "trend": "up"
    },
    "metrics": {
      "todayVolume": "125000.00",
      "yesterdayVolume": "112000.00",
      "weekVolume": "875000.00",
      "monthVolume": "3500000.00"
    }
  }
}
```

## Performance Metrics

### Get Performance Report

```javascript
// Node.js
const performance = await payvost.analytics.getPerformance({
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  metrics: [
    'transaction_speed',
    'success_rate',
    'error_rate',
    'average_fee'
  ]
});

console.log('Avg Transaction Speed:', performance.averageSpeed);
console.log('Success Rate:', performance.successRate);
console.log('Error Rate:', performance.errorRate);
```

### Response

```json
{
  "success": true,
  "data": {
    "averageSpeed": "2.3s",
    "medianSpeed": "1.8s",
    "successRate": "98.2%",
    "errorRate": "1.8%",
    "averageFee": "2.50",
    "uptime": "99.95%",
    "breakdown": {
      "instant": "85.2%",
      "fast": "12.3%",
      "standard": "2.5%"
    }
  }
}
```

## Scheduled Reports

### Create Scheduled Report

```javascript
// Node.js
const scheduled = await payvost.reports.createSchedule({
  reportType: 'transactions',
  schedule: {
    frequency: 'daily', // 'daily', 'weekly', 'monthly'
    time: '09:00',
    timezone: 'America/New_York',
    dayOfWeek: 'monday', // for weekly
    dayOfMonth: 1 // for monthly
  },
  recipients: [
    {
      email: 'finance@example.com',
      name: 'Finance Team'
    }
  ],
  format: 'pdf',
  filters: {
    currency: 'USD',
    status: 'succeeded'
  }
});

console.log('Schedule ID:', scheduled.id);
```

### List Scheduled Reports

```javascript
// Node.js
const schedules = await payvost.reports.listSchedules();

schedules.data.forEach(schedule => {
  console.log(`${schedule.reportType}: ${schedule.schedule.frequency}`);
});
```

## Webhooks for Reports

Receive notifications when reports are generated:

```javascript
// Node.js webhook handler
app.post('/webhooks/reports', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'report.generated':
      console.log('Report ready:', event.data.reportId);
      console.log('Download:', event.data.downloadUrl);
      // Send to recipients or store
      break;
      
    case 'report.export_completed':
      console.log('Export completed:', event.data.exportId);
      // Notify user
      break;
      
    case 'report.schedule_failed':
      console.log('Scheduled report failed:', event.data.scheduleId);
      console.log('Error:', event.data.error);
      // Alert admin
      break;
  }
  
  res.json({ received: true });
});
```

## Data Visualization

### Get Chart Data

```javascript
// Node.js
const chartData = await payvost.analytics.getChartData({
  chartType: 'line', // 'line', 'bar', 'pie', 'area'
  metric: 'volume',
  groupBy: 'day',
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  currency: 'USD'
});

console.log('Chart data points:', chartData.data.length);
// Use with charting library (Chart.js, Recharts, etc.)
```

## Error Handling

```javascript
try {
  const report = await payvost.reports.exportTransactions({
    startDate: '2025-10-01',
    endDate: '2025-10-31'
  });
} catch (error) {
  switch(error.code) {
    case 'invalid_date_range':
      console.error('Date range exceeds maximum allowed');
      break;
      
    case 'too_many_records':
      console.error('Too many records to export at once');
      console.error('Max records:', error.maxRecords);
      break;
      
    case 'report_generation_failed':
      console.error('Report generation failed:', error.message);
      break;
      
    default:
      console.error('Report error:', error.message);
  }
}
```

## Best Practices

1. **Cache Reports**: Cache frequently accessed reports
2. **Schedule Wisely**: Schedule large reports during off-peak hours
3. **Limit Date Ranges**: Use reasonable date ranges for large datasets
4. **Export Incrementally**: For large datasets, export in chunks
5. **Monitor Performance**: Track report generation times
6. **Store Securely**: Store exported files securely
7. **Clean Up**: Delete old export files regularly

## Next Steps

- **[Webhook Integration](./08-webhook-notifications.md)** - Report webhooks
- **[Fraud Detection](./09-fraud-detection-compliance.md)** - Compliance reporting
- **[Testing Guide](./12-testing-sandbox.md)** - Test reporting features
