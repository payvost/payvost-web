# User Management & KYC Integration

Manage user accounts, authentication, and KYC (Know Your Customer) verification processes.

## Overview

Payvost's User Management API provides:
- **User registration and authentication**
- **Profile management**
- **KYC/AML verification**
- **Document upload and verification**
- **User tier management**
- **Access control and permissions**

## User Registration

### Create User

```javascript
// Node.js
const user = await payvost.users.create({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'securePassword123!', // Will be hashed
  country: 'US',
  phone: '+1234567890',
  dateOfBirth: '1990-01-15',
  metadata: {
    referralCode: 'REF123'
  }
});

console.log('User ID:', user.id);
console.log('KYC Status:', user.kycStatus); // 'pending'
```

```python
# Python
user = payvost.User.create(
    email='user@example.com',
    name='John Doe',
    password='securePassword123!',
    country='US',
    phone='+1234567890',
    date_of_birth='1990-01-15',
    metadata={
        'referral_code': 'REF123'
    }
)

print(f'User ID: {user.id}')
print(f'KYC Status: {user.kyc_status}')
```

```bash
# cURL
curl https://api.payvost.com/v1/users \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "securePassword123!",
    "country": "US",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-15"
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "usr_1234567890abcdef",
    "email": "user@example.com",
    "name": "John Doe",
    "country": "US",
    "phone": "+1234567890",
    "kycStatus": "pending",
    "userTier": "STANDARD",
    "role": "user",
    "createdAt": "2025-11-01T10:00:00Z",
    "updatedAt": "2025-11-01T10:00:00Z"
  }
}
```

## User Authentication

### Email/Password Login

```javascript
// Node.js
const session = await payvost.auth.login({
  email: 'user@example.com',
  password: 'securePassword123!'
});

console.log('Access Token:', session.accessToken);
console.log('Refresh Token:', session.refreshToken);
console.log('Expires at:', session.expiresAt);
```

### Two-Factor Authentication (2FA)

#### Enable 2FA

```javascript
// Node.js
const twoFactor = await payvost.auth.enableTwoFactor('usr_1234567890abcdef');

console.log('Secret:', twoFactor.secret);
console.log('QR Code URL:', twoFactor.qrCodeUrl);
console.log('Backup codes:', twoFactor.backupCodes);
```

#### Verify 2FA Setup

```javascript
// Node.js
await payvost.auth.verifyTwoFactor('usr_1234567890abcdef', {
  code: '123456'
});

console.log('2FA enabled successfully');
```

#### Login with 2FA

```javascript
// Node.js
try {
  const session = await payvost.auth.login({
    email: 'user@example.com',
    password: 'securePassword123!',
    twoFactorCode: '123456'
  });
} catch (error) {
  if (error.code === 'two_factor_required') {
    // Prompt user for 2FA code
  }
}
```

## User Profile Management

### Get User Profile

```javascript
// Node.js
const user = await payvost.users.retrieve('usr_1234567890abcdef');

console.log('Name:', user.name);
console.log('Email:', user.email);
console.log('KYC Status:', user.kycStatus);
console.log('User Tier:', user.userTier);
```

### Update User Profile

```javascript
// Node.js
const updatedUser = await payvost.users.update('usr_1234567890abcdef', {
  name: 'John Michael Doe',
  phone: '+1234567891',
  address: {
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US'
  }
});

console.log('Updated:', updatedUser.name);
```

```python
# Python
updated_user = payvost.User.update(
    'usr_1234567890abcdef',
    name='John Michael Doe',
    phone='+1234567891',
    address={
        'street': '123 Main Street',
        'city': 'New York',
        'state': 'NY',
        'postal_code': '10001',
        'country': 'US'
    }
)

print(f'Updated: {updated_user.name}')
```

## KYC Verification

### User Tiers

| Tier | Daily Limit | Monthly Limit | Features |
|------|-------------|---------------|----------|
| `STANDARD` | $1,000 | $10,000 | Basic KYC required |
| `VERIFIED` | $10,000 | $100,000 | Enhanced KYC required |
| `PREMIUM` | $50,000 | $500,000 | Full KYC + business verification |
| `ENTERPRISE` | Custom | Custom | Custom due diligence |

### KYC Status

- `pending`: No verification started
- `submitted`: Documents submitted for review
- `under_review`: Documents being reviewed
- `verified`: KYC approved
- `rejected`: KYC rejected
- `requires_resubmission`: Additional documents needed

### Submit KYC Documents

```javascript
// Node.js
const kyc = await payvost.users.submitKYC('usr_1234567890abcdef', {
  documentType: 'passport', // 'drivers_license', 'national_id', 'passport'
  documentNumber: 'AB1234567',
  issuingCountry: 'US',
  expiryDate: '2030-12-31',
  documents: [
    {
      type: 'identity_front',
      file: frontImageBase64 // or file upload
    },
    {
      type: 'identity_back',
      file: backImageBase64
    },
    {
      type: 'selfie',
      file: selfieImageBase64
    }
  ],
  address: {
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US'
  },
  occupation: 'Software Engineer',
  sourceOfFunds: 'salary'
});

console.log('KYC Submission ID:', kyc.id);
console.log('Status:', kyc.status);
```

### Upload Documents

```javascript
// Node.js with File Upload
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('userId', 'usr_1234567890abcdef');
form.append('documentType', 'passport');
form.append('identity_front', fs.createReadStream('passport-front.jpg'));
form.append('identity_back', fs.createReadStream('passport-back.jpg'));
form.append('selfie', fs.createReadStream('selfie.jpg'));
form.append('proof_of_address', fs.createReadStream('utility-bill.pdf'));

const kyc = await payvost.users.uploadKYCDocuments(form);

console.log('Documents uploaded:', kyc.documentsCount);
```

```bash
# cURL with file upload
curl https://api.payvost.com/v1/users/usr_1234567890abcdef/kyc/documents \
  -X POST \
  -H "Authorization: Bearer sk_live_your_key" \
  -F "documentType=passport" \
  -F "identity_front=@passport-front.jpg" \
  -F "identity_back=@passport-back.jpg" \
  -F "selfie=@selfie.jpg"
```

### Get KYC Status

```javascript
// Node.js
const kycStatus = await payvost.users.getKYCStatus('usr_1234567890abcdef');

console.log('Status:', kycStatus.status);
console.log('Tier:', kycStatus.tier);
console.log('Submitted at:', kycStatus.submittedAt);
console.log('Verified at:', kycStatus.verifiedAt);

if (kycStatus.rejectionReason) {
  console.log('Rejection reason:', kycStatus.rejectionReason);
  console.log('Required actions:', kycStatus.requiredActions);
}
```

### Response

```json
{
  "success": true,
  "data": {
    "userId": "usr_1234567890abcdef",
    "status": "verified",
    "tier": "VERIFIED",
    "documents": [
      {
        "type": "identity_front",
        "status": "verified",
        "verifiedAt": "2025-11-01T12:00:00Z"
      },
      {
        "type": "identity_back",
        "status": "verified",
        "verifiedAt": "2025-11-01T12:00:00Z"
      },
      {
        "type": "selfie",
        "status": "verified",
        "verifiedAt": "2025-11-01T12:00:00Z"
      }
    ],
    "submittedAt": "2025-11-01T10:00:00Z",
    "verifiedAt": "2025-11-01T12:00:00Z",
    "expiresAt": "2026-11-01T12:00:00Z"
  }
}
```

## Business KYC

For business accounts, additional verification is required:

```javascript
// Node.js
const businessKYC = await payvost.users.submitBusinessKYC('usr_business_123', {
  businessName: 'Acme Corporation',
  businessType: 'corporation', // 'sole_proprietor', 'partnership', 'llc', 'corporation'
  registrationNumber: 'REG123456',
  taxId: 'TAX789012',
  incorporationDate: '2020-01-15',
  incorporationCountry: 'US',
  website: 'https://acmecorp.com',
  businessAddress: {
    street: '456 Business Ave',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94102',
    country: 'US'
  },
  documents: [
    {
      type: 'incorporation_certificate',
      file: certificateBase64
    },
    {
      type: 'tax_document',
      file: taxDocBase64
    },
    {
      type: 'business_license',
      file: licenseBase64
    }
  ],
  beneficialOwners: [
    {
      name: 'John Doe',
      ownership: '60',
      documentType: 'passport',
      documentNumber: 'AB1234567',
      documents: [
        {
          type: 'identity_front',
          file: ownerIdBase64
        }
      ]
    }
  ],
  directors: [
    {
      name: 'Jane Smith',
      title: 'CEO',
      documentType: 'drivers_license',
      documentNumber: 'DL9876543'
    }
  ]
});

console.log('Business KYC Status:', businessKYC.status);
```

## User Roles and Permissions

### Assign Role

```javascript
// Node.js
await payvost.users.assignRole('usr_1234567890abcdef', {
  role: 'admin', // 'user', 'admin', 'merchant', 'agent'
  permissions: [
    'users:read',
    'users:write',
    'wallets:read',
    'transfers:create'
  ]
});
```

### Check Permissions

```javascript
// Node.js
const hasPermission = await payvost.users.checkPermission(
  'usr_1234567890abcdef',
  'transfers:create'
);

if (hasPermission) {
  // Allow action
}
```

## User Activity Logs

### Get Activity History

```javascript
// Node.js
const activities = await payvost.users.getActivityLog('usr_1234567890abcdef', {
  limit: 50,
  offset: 0,
  startDate: '2025-10-01',
  endDate: '2025-11-01',
  action: 'login' // or 'wallet_created', 'transfer_sent', etc.
});

activities.data.forEach(activity => {
  console.log(`${activity.action}: ${activity.timestamp} from ${activity.ipAddress}`);
});
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "act_abc123",
      "userId": "usr_1234567890abcdef",
      "action": "login",
      "ipAddress": "203.0.113.42",
      "userAgent": "Mozilla/5.0...",
      "location": {
        "city": "New York",
        "country": "US"
      },
      "metadata": {
        "twoFactorUsed": true
      },
      "timestamp": "2025-11-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 245,
    "limit": 50,
    "offset": 0
  }
}
```

## Password Management

### Change Password

```javascript
// Node.js
await payvost.users.changePassword('usr_1234567890abcdef', {
  currentPassword: 'oldPassword123!',
  newPassword: 'newSecurePassword456!'
});
```

### Reset Password

```javascript
// Step 1: Request reset
await payvost.auth.requestPasswordReset({
  email: 'user@example.com'
});

// Step 2: User receives email with reset token
// Step 3: Reset password with token
await payvost.auth.resetPassword({
  token: 'reset_token_from_email',
  newPassword: 'newSecurePassword456!'
});
```

## Email Verification

### Send Verification Email

```javascript
// Node.js
await payvost.users.sendVerificationEmail('usr_1234567890abcdef');
```

### Verify Email

```javascript
// Node.js
await payvost.users.verifyEmail({
  token: 'verification_token_from_email'
});
```

## Phone Verification

### Send Verification Code

```javascript
// Node.js
await payvost.users.sendPhoneVerification('usr_1234567890abcdef', {
  phone: '+1234567890'
});
```

### Verify Phone Number

```javascript
// Node.js
await payvost.users.verifyPhone('usr_1234567890abcdef', {
  code: '123456'
});
```

## User Search and Filtering

### Search Users

```javascript
// Node.js
const users = await payvost.users.search({
  query: 'john',
  filters: {
    country: 'US',
    kycStatus: 'verified',
    userTier: 'VERIFIED'
  },
  limit: 20,
  offset: 0
});

users.data.forEach(user => {
  console.log(`${user.name} - ${user.email}`);
});
```

## Deactivate/Delete User

### Deactivate User

```javascript
// Node.js
await payvost.users.deactivate('usr_1234567890abcdef', {
  reason: 'user_request'
});
```

### Reactivate User

```javascript
// Node.js
await payvost.users.reactivate('usr_1234567890abcdef');
```

### Delete User (GDPR)

```javascript
// Node.js
await payvost.users.delete('usr_1234567890abcdef', {
  reason: 'gdpr_request',
  confirmEmail: 'user@example.com'
});

// User data will be anonymized after 30 days
```

## Webhooks

Handle user-related events:

```javascript
// Node.js webhook handler
app.post('/webhooks/users', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'user.created':
      console.log('New user:', event.data.email);
      // Send welcome email
      break;
      
    case 'user.kyc_submitted':
      console.log('KYC submitted:', event.data.userId);
      // Notify admin for review
      break;
      
    case 'user.kyc_verified':
      console.log('KYC verified:', event.data.userId);
      // Upgrade user tier, send notification
      break;
      
    case 'user.kyc_rejected':
      console.log('KYC rejected:', event.data.userId);
      console.log('Reason:', event.data.rejectionReason);
      // Notify user to resubmit
      break;
      
    case 'user.suspicious_activity':
      console.log('Suspicious activity:', event.data.userId);
      console.log('Alert type:', event.data.alertType);
      // Review and take action
      break;
  }
  
  res.json({ received: true });
});
```

## Error Handling

```javascript
try {
  const user = await payvost.users.create({
    email: 'user@example.com',
    name: 'John Doe',
    country: 'US'
  });
} catch (error) {
  switch(error.code) {
    case 'email_already_exists':
      console.error('Email already registered');
      break;
      
    case 'invalid_phone':
      console.error('Invalid phone number format');
      break;
      
    case 'kyc_document_invalid':
      console.error('Invalid document:', error.documentType);
      console.error('Reason:', error.reason);
      break;
      
    case 'age_requirement_not_met':
      console.error('User must be at least 18 years old');
      break;
      
    default:
      console.error('User error:', error.message);
  }
}
```

## Best Practices

1. **Secure Passwords**: Enforce strong password requirements
2. **Enable 2FA**: Encourage users to enable two-factor authentication
3. **Verify Email/Phone**: Verify contact information early
4. **KYC Compliance**: Complete KYC before allowing high-value transactions
5. **Monitor Activity**: Track suspicious activities and anomalies
6. **Data Privacy**: Handle user data in compliance with GDPR, CCPA
7. **Regular Updates**: Keep user information current

## Next Steps

- **[Wallet Integration](./03-wallet-integration.md)** - Create user wallets
- **[Authentication](./02-authentication-api-keys.md)** - OAuth and API authentication
- **[Fraud Detection](./09-fraud-detection-compliance.md)** - Compliance monitoring
