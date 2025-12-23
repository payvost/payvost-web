# Business Email Integration in Invoice FROM Section

## Overview
Updated the invoice PDF generation to display the business email address in the "FROM" section, collected during business onboarding and verified during KYC.

## Changes Made

### File Modified
`/services/pdf-generator/InvoiceDocument.js`

### What Changed

#### 1. **Business Invoice Template - FROM Section (Line 502)**
**Before:**
```javascript
invoice.fromEmail && React.createElement(Text, { style: activeStyles.mutedText }, invoice.fromEmail)
```

**After:**
```javascript
(invoice.fromEmail || businessProfile.businessEmail) && React.createElement(Text, { style: activeStyles.mutedText }, invoice.fromEmail || businessProfile.businessEmail)
```

#### 2. **Business Invoice Template - Footer (Line 570)**
**Before:**
```javascript
invoice.fromEmail && React.createElement(Text, { style: baseStyles.footerText }, `Email: ${invoice.fromEmail}`)
```

**After:**
```javascript
(invoice.fromEmail || businessProfile.businessEmail) && React.createElement(Text, { style: baseStyles.footerText }, `Email: ${invoice.fromEmail || businessProfile.businessEmail}`)
```

#### 3. **Personal Invoice Template - FROM Section (Line 618)**
**Before:**
```javascript
invoice.fromEmail && React.createElement(Text, { style: baseStyles.mutedText }, invoice.fromEmail)
```

**After:**
```javascript
(invoice.fromEmail || businessProfile.businessEmail) && React.createElement(Text, { style: baseStyles.mutedText }, invoice.fromEmail || businessProfile.businessEmail)
```

#### 4. **Personal Invoice Template - Footer (Line 682)**
**Before:**
```javascript
invoice.fromEmail && React.createElement(Text, { style: baseStyles.footerText }, `Email: ${invoice.fromEmail}`)
```

**After:**
```javascript
(invoice.fromEmail || businessProfile.businessEmail) && React.createElement(Text, { style: baseStyles.footerText }, `Email: ${invoice.fromEmail || businessProfile.businessEmail}`)
```

## Data Flow

### Business Email Sources (in priority order)
1. **`invoice.fromEmail`** - Email explicitly set on the invoice document
2. **`businessProfile.businessEmail`** - Email from business profile (collected during onboarding)

### Fallback Logic
The code uses `||` (OR) operator to prioritize:
- **First choice**: `invoice.fromEmail` (if set on invoice)
- **Fallback**: `businessProfile.businessEmail` (from business profile)

### Display Logic
- Email displays **only if at least one source is available**
- Uses `&&` conditional rendering to prevent empty text nodes

## Business Onboarding Integration

### Where Email is Collected
- **Form**: `/src/app/dashboard/get-started/onboarding/business/page.tsx`
- **Field**: `contact-email` input
- **Storage**: Firestore `business_onboarding` collection as `email` field

### Code Reference
```tsx
// From business onboarding form (line 140)
const businessData = {
  userId: user.uid,
  name: formData.get('business-name'),
  type: formData.get('business-type'),
  industry: formData.get('industry'),
  registrationNumber: formData.get('registration-number'),
  taxId: formData.get('tax-id'),
  address: formData.get('business-address'),
  email: formData.get('contact-email'),  // ← Business Email
  website: formData.get('website') || null,
  logo: logoUrl,
};
```

### KYC Verification
- **Email verification** is part of KYC/AML workflow
- Located in: `/src/lib/kyc/verification-workflow.ts`
- Verifies email is deliverable and domain valid
- Status tracked in verification details

## PDF Display Format

### FROM Section Format
```
┌─ From ──────────────────────────────────────┐
│ QWIBIK TECHNOLOGIES LIMITED                 │
│ 38, AKINTAN STREET, SURULERE LAGOS          │
│ Reg: ABC123                                  │
│ Tax ID: XX-XXXXX                            │
│ business@qwibik.com                         │ ← Business Email
└──────────────────────────────────────────────┘
```

### Footer Format
```
Thank you for your business!
Email: business@qwibik.com ← Business Email with Label
```

## Email Priority Examples

### Scenario 1: Invoice with explicit email
- `invoice.fromEmail` = "invoices@company.com"
- `businessProfile.businessEmail` = "contact@company.com"
- **Result**: Displays "invoices@company.com" (takes priority)

### Scenario 2: Using business profile email
- `invoice.fromEmail` = null/undefined
- `businessProfile.businessEmail` = "contact@qwibik.com"
- **Result**: Displays "contact@qwibik.com" (fallback)

### Scenario 3: No email available
- `invoice.fromEmail` = null/undefined
- `businessProfile.businessEmail` = null/undefined
- **Result**: Email section not displayed (conditional rendering)

## Benefits

✅ **Verified Email Display**
- Email is verified during KYC process
- Provides verified contact information on invoice

✅ **Flexibility**
- Invoices can override with specific email if needed
- Falls back to business profile email when not specified

✅ **Professional Appearance**
- Shows complete business contact information
- Matches layout with other business details (Reg, Tax ID)

✅ **Data Consistency**
- Uses same email collected and verified during onboarding
- No duplicate data entry required

## Related Files

- **Business Onboarding Form**: `/src/app/dashboard/get-started/onboarding/business/page.tsx`
- **KYC Verification**: `/src/lib/kyc/verification-workflow.ts`
- **Business Profile Settings**: `/src/components/business-profile-settings.tsx`
- **Admin Business Onboarding**: `/src/app/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/business-onboarding/page.tsx`

## Testing

### What to Verify
1. ✅ Business email displays in FROM section when available
2. ✅ Email shows in footer of PDF
3. ✅ Fallback works when email not set on invoice
4. ✅ Email hidden if neither source is available
5. ✅ Works for both business and personal invoice templates
6. ✅ Email is properly formatted and readable

### Test Cases

**Test 1: Complete Business Profile**
- Create invoice with full business profile including email
- Expected: Email displays in FROM section

**Test 2: Invoice Override Email**
- Set explicit `fromEmail` on invoice
- Expected: Overrides business profile email

**Test 3: No Email Available**
- Invoice with no email, business profile with no email
- Expected: Email section not rendered

## Backward Compatibility

✅ **Fully backward compatible**
- Existing invoices without `businessProfile.businessEmail` still work
- Falls back to `invoice.fromEmail` if available
- No breaking changes to invoice schema

## Future Enhancements

1. **Email verification badge**: Show verified status on invoice
2. **Multiple contact emails**: Support additional business contact emails
3. **Phone display**: Add business phone number alongside email
4. **Department emails**: Show department-specific contact emails for different invoice types
