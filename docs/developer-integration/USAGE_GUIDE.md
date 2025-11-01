# Developer Integration Articles - Usage Guide

## Overview

This directory contains 12 comprehensive developer integration articles for Payvost, following PayPal/Stripe documentation standards. These articles are designed to be:

1. **Copy-ready**: Can be copied to another repository as-is
2. **Agent-friendly**: Structured for easy parsing by Copilot agents
3. **Developer-complete**: Include everything a developer needs to integrate

## Article Structure

Each article (numbered 01-12) follows this consistent format:

### Standard Sections
1. **Overview** - Introduction and features
2. **Prerequisites** - What's needed to start
3. **Code Examples** - Multi-language examples (JavaScript, Python, PHP, Ruby, cURL)
4. **API Reference** - Request/response formats
5. **Use Cases** - Practical scenarios
6. **Error Handling** - Common errors and solutions
7. **Webhooks** (where applicable) - Event handling
8. **Best Practices** - Recommendations
9. **Next Steps** - Related articles

### Code Example Format
- JavaScript/Node.js (primary)
- Python
- PHP (most articles)
- Ruby (getting started)
- cURL/REST (all articles)

### Placeholder Format
```javascript
// API keys
'sk_live_your_key_here'
'pk_test_your_key_here'

// URLs  
'https://yourapp.com/webhooks'
'https://api.payvost.com'

// IDs
'usr_abc123'
'acc_xyz789'
'txn_123456'

// Emails
'user@example.com'
'customer@example.com'
```

## Menu Structure

The articles form a logical menu hierarchy:

```
Developer Integration
├── Getting Started (Introduction)
├── Core Integration
│   ├── Authentication & API Keys
│   ├── Wallet Integration
│   ├── Payment Processing
│   ├── Transfer & Remittance
│   ├── User Management & KYC
│   └── Currency Exchange
├── Advanced Features
│   ├── Webhooks & Notifications
│   ├── Fraud Detection & Compliance
│   ├── Transaction Reporting
│   └── Multi-Currency Accounts
└── Testing & Deployment
    └── Testing & Sandbox Environment
```

## For Another Repository

### Direct Copy
You can copy the entire `docs/developer-integration/` directory to another repository:

```bash
cp -r docs/developer-integration /path/to/other/repo/docs/
```

### For Documentation Sites

The articles are written in standard Markdown and work with:
- **Docusaurus**: Add to `docs/` folder
- **GitBook**: Add to root or docs folder
- **MkDocs**: Add to `docs/` with nav configuration
- **VuePress**: Add to `.vuepress/` structure
- **Jekyll**: Add to `_docs/` folder
- **ReadTheDocs**: Add to `docs/` with index

### For Copilot Agents

When instructing a Copilot agent to use these articles:

```
I have developer integration documentation in docs/developer-integration/.
There are 12 articles numbered 01-12 covering:
- Getting Started (01)
- Authentication (02)
- Wallets (03)
- Payments (04)
- Transfers (05)
- KYC (06)
- Exchange (07)
- Webhooks (08)
- Fraud (09)
- Reporting (10)
- Multi-Currency (11)
- Testing (12)

Please [your instruction here] using these articles as reference.
```

## Customization Guide

### Replace Placeholders

Find and replace these placeholders with your actual values:

1. **API URLs**
   - `https://api.payvost.com` → Your production API
   - `https://sandbox-api.payvost.com` → Your sandbox API
   - `https://dashboard.payvost.com` → Your dashboard URL

2. **API Key Formats**
   - `sk_live_*` → Your live secret key format
   - `sk_test_*` → Your test secret key format
   - `pk_live_*` → Your publishable key format

3. **Support Contacts**
   - `developers@payvost.com` → Your support email
   - `https://community.payvost.com` → Your community URL
   - `https://docs.payvost.com` → Your docs URL

4. **Company Name**
   - `Payvost` → Your company name (throughout)

### Add Your Branding

Update the following files:
- `README.md` - Main navigation and branding
- All article footers - Copyright and licensing

### Customize Code Examples

Each article includes placeholder values:
- User IDs: `usr_abc123`
- Wallet IDs: `acc_xyz789`
- Transaction IDs: `txn_123456`
- Emails: `user@example.com`

Replace with your format or keep as examples.

## Integration Scenarios

### E-commerce Platform
Primary articles: 04, 08, 12

### Remittance Service
Primary articles: 05, 07, 11

### Marketplace
Primary articles: 06, 03, 09

### Financial Dashboard
Primary articles: 10, 11, 03

## Content Statistics

| Article | Title | Lines | Words (est.) |
|---------|-------|-------|--------------|
| 01 | Getting Started | 289 | 2,300 |
| 02 | Authentication | 442 | 3,500 |
| 03 | Wallet Integration | 570 | 4,500 |
| 04 | Payment Processing | 666 | 5,300 |
| 05 | Transfer & Remittance | 729 | 5,800 |
| 06 | User Management & KYC | 688 | 5,500 |
| 07 | Currency Exchange | 659 | 5,200 |
| 08 | Webhooks | 707 | 5,600 |
| 09 | Fraud & Compliance | 711 | 5,600 |
| 10 | Reporting | 748 | 5,900 |
| 11 | Multi-Currency | 688 | 5,500 |
| 12 | Testing & Sandbox | 725 | 5,700 |
| **Total** | | **7,848** | **~62,000** |

## Quality Checklist

Each article includes:
- ✅ Multiple code examples (JavaScript, Python, cURL minimum)
- ✅ Request/response examples with JSON
- ✅ Error handling section
- ✅ Best practices
- ✅ Cross-references to related articles
- ✅ Webhook integration (where applicable)
- ✅ Real-world use cases
- ✅ Testing considerations

## Maintenance

### Updating Articles

1. **API Changes**: Update code examples and responses
2. **New Features**: Add new sections to relevant articles
3. **Deprecations**: Mark deprecated features clearly
4. **Links**: Update all internal and external links

### Version Control

Consider versioning the documentation:
- Tag releases: `docs-v1.0.0`
- Maintain changelog in README
- Note breaking changes clearly

## Support

For questions about these articles:
- Structure: See this USAGE_GUIDE.md
- Content: Review individual articles
- Integration: Start with 01-getting-started.md
- Customization: See "Customization Guide" above

---

**Note**: These articles were created to be comprehensive, copy-ready, and agent-friendly. They follow industry-standard documentation patterns and can be used immediately or customized for your specific needs.
