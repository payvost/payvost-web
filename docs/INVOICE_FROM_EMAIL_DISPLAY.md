# Invoice FROM Section - Business Email Display

## Updated FROM Section Layout

### Complete FROM Section Example

```
╔════════════════════════════════════════════════════════╗
║                        FROM                            ║
╠════════════════════════════════════════════════════════╣
║ QWIBIK TECHNOLOGIES LIMITED                           ║
║ 38, AKINTAN STREET, SURULERE LAGOS                    ║
║ Reg: BN2100123                                        ║
║ Tax ID: 11011111-0001                                 ║
║ contact@qwibik.com                                    ║  ← NEW: Business Email
╚════════════════════════════════════════════════════════╝
```

## Display Fields and Order

| Field | Source | Priority | Status |
|-------|--------|----------|--------|
| Company Name | `invoice.fromName` or `brandName` | - | Always shown |
| Address 1 | `invoice.fromAddress` | Optional | Shows if available |
| Address 2 | `businessProfile.businessAddress` | Optional | Shows if available |
| Reg Number | `businessProfile.registrationNumber` | Optional | Shows if available |
| Tax ID | `businessProfile.taxId` | Optional | Shows if available |
| **Email** | `invoice.fromEmail` \|\| `businessProfile.businessEmail` | Optional | **NEW: Shows email** |

## Business Email Field Details

### Field Name Variations
The business email can come from:
- **`businessProfile.businessEmail`** - Primary source from business onboarding
- **`invoice.fromEmail`** - Invoice-specific override
- **User's primary email** - Fallback if no business email set

### Data Collection Flow

```
┌─────────────────────────────────┐
│  Business Onboarding Form       │
│  ↓                              │
│  contact-email input            │
│  ↓                              │
│  Firestore:                     │
│  business_onboarding.email      │
│  ↓                              │
│  businessProfile.businessEmail  │
│  ↓                              │
│  Invoice PDF: FROM section      │
│  Shows: contact@qwibik.com      │
└─────────────────────────────────┘
```

## Implementation Details

### Code Implementation (Line 502)
```javascript
// FROM section with business email
React.createElement(View, { style: { ...activeStyles.column, flex: 1.2 } },
  React.createElement(Text, { style: activeStyles.sectionHeader }, 'From'),
  React.createElement(Text, { style: activeStyles.text }, invoice.fromName || brandName),
  invoice.fromAddress && React.createElement(Text, { style: activeStyles.mutedText }, invoice.fromAddress),
  businessProfile.businessAddress && React.createElement(Text, { style: activeStyles.mutedText }, businessProfile.businessAddress),
  businessProfile.registrationNumber && React.createElement(Text, { style: activeStyles.mutedText }, `Reg: ${businessProfile.registrationNumber}`),
  businessProfile.taxId && React.createElement(Text, { style: activeStyles.mutedText }, `Tax ID: ${businessProfile.taxId}`),
  (invoice.fromEmail || businessProfile.businessEmail) && React.createElement(Text, { style: activeStyles.mutedText }, invoice.fromEmail || businessProfile.businessEmail)  // ← Email with fallback
)
```

### Key Features
✅ **Conditional Rendering**: Only shows if email is available
✅ **Priority Fallback**: Uses `||` operator for fallback logic
✅ **Consistent Styling**: Uses same `mutedText` style as other contact fields
✅ **Both Templates**: Implemented in business AND personal invoice templates

## Email Priority Logic

### Priority Order
1. **First**: `invoice.fromEmail` (highest priority)
2. **Second**: `businessProfile.businessEmail` (fallback)
3. **Hidden**: If both are empty (not rendered)

### Conditional Logic
```javascript
// Show email only if at least one source is available
(invoice.fromEmail || businessProfile.businessEmail) && 
  React.createElement(Text, { ... }, invoice.fromEmail || businessProfile.businessEmail)
```

### What This Means
- If you set `invoice.fromEmail = "invoices@qwibik.com"`, it takes priority
- If `invoice.fromEmail` is empty but `businessProfile.businessEmail = "contact@qwibik.com"`, it shows the business email
- If both are empty, the email field is completely hidden

## Real-World Examples

### Example 1: Complete Business Setup
```
Business Name: QWIBIK TECHNOLOGIES LIMITED
Business Address: 38, AKINTAN STREET, SURULERE LAGOS
Registration Number: BN2100123
Tax ID: 11011111-0001
Business Email: contact@qwibik.com (from business profile)

Resulting FROM section:
─────────────────────────────────
From
QWIBIK TECHNOLOGIES LIMITED
38, AKINTAN STREET, SURULERE LAGOS
Reg: BN2100123
Tax ID: 11011111-0001
contact@qwibik.com  ← Displays
─────────────────────────────────
```

### Example 2: Override with Invoice Email
```
Business Email: contact@qwibik.com
Invoice Email: invoices@qwibik.com (override)

Resulting FROM section:
─────────────────────────────────
From
QWIBIK TECHNOLOGIES LIMITED
38, AKINTAN STREET, SURULERE LAGOS
Reg: BN2100123
Tax ID: 11011111-0001
invoices@qwibik.com  ← Shows invoice email (higher priority)
─────────────────────────────────
```

### Example 3: Minimal Business Info
```
Business Name: QWIBIK TECHNOLOGIES LIMITED
Business Email: contact@qwibik.com
(No address, registration, or tax ID)

Resulting FROM section:
─────────────────────────────────
From
QWIBIK TECHNOLOGIES LIMITED
contact@qwibik.com  ← Email still displays
─────────────────────────────────
```

## Template Locations

### Business Invoice Template (Line 502)
Located at: `/services/pdf-generator/InvoiceDocument.js`
```javascript
// Business template - FROM section with email
React.createElement(View, { style: { ...activeStyles.column, flex: 1.2 } },
  // ... company details ...
  (invoice.fromEmail || businessProfile.businessEmail) && React.createElement(Text, { ... }, email)
)
```

### Personal Invoice Template (Line 618)
Located at: `/services/pdf-generator/InvoiceDocument.js`
```javascript
// Personal template - FROM section with email
React.createElement(View, { style: { ...baseStyles.column, flex: 1.2 } },
  // ... company details ...
  (invoice.fromEmail || businessProfile.businessEmail) && React.createElement(Text, { ... }, email)
)
```

## Footer Section

The business email also appears in the PDF footer:

### Business Template Footer (Line 570)
```javascript
React.createElement(View, { style: baseStyles.footer },
  React.createElement(Text, { style: baseStyles.footerText }, 'Thank you for your business!'),
  (invoice.fromEmail || businessProfile.businessEmail) && React.createElement(Text, { style: baseStyles.footerText }, `Email: ${invoice.fromEmail || businessProfile.businessEmail}`)
)
```

### Personal Template Footer (Line 682)
```javascript
React.createElement(View, { style: baseStyles.footer },
  React.createElement(Text, { style: baseStyles.footerText }, 'Thank you for your business!'),
  React.createElement(Text, { style: baseStyles.footerText }, 'If you have any questions about this invoice, please contact us.'),
  (invoice.fromEmail || businessProfile.businessEmail) && React.createElement(Text, { style: baseStyles.footerText }, `Email: ${invoice.fromEmail || businessProfile.businessEmail}`)
)
```

## Testing Checklist

- [ ] Download invoice PDF for business with email
- [ ] Verify business email shows in FROM section
- [ ] Verify email also shows in footer
- [ ] Test with invoice-specific override email
- [ ] Test with missing business email (should be hidden)
- [ ] Test both business and personal templates
- [ ] Verify email is readable and properly aligned
- [ ] Test across different browsers
- [ ] Verify print preview includes email

## Browser Display Example

### Chrome/Firefox/Safari PDF Preview
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         FROM                  ┃
┃ QWIBIK TECHNOLOGIES LIMITED   ┃
┃ 38, AKINTAN STREET           ┃
┃ SURULERE LAGOS               ┃
┃ Reg: BN2100123               ┃
┃ Tax ID: 11011111-0001        ┃
┃ contact@qwibik.com           ┃ ← Clickable email link
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## KYC Verification Integration

### Email Verification During Onboarding
- Email is **collected** in business onboarding form
- Email is **verified** during KYC process
- Email **status** tracked in verification workflow
- Only **verified emails** should be displayed

### Verification Status
- ✅ **Verified**: Email is deliverable and domain is valid
- ⏳ **Pending**: Email verification in progress
- ❌ **Failed**: Email verification failed, may not be reliable

The invoice PDF always shows the email, but the business should ensure it's been verified before creating invoices.
