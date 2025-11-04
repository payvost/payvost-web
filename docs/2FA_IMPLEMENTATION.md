# Two-Factor Authentication (2FA) Implementation

## Overview

This implementation adds comprehensive two-factor authentication (2FA) support to the Payvost platform, allowing users to secure their accounts using three different methods:

1. **Authenticator App** (Recommended) - TOTP-based authentication using apps like Google Authenticator, Authy, or Microsoft Authenticator
2. **Email** - Verification codes sent to the user's registered email
3. **SMS** - Verification codes sent to the user's phone number

## Features

### For Users
- ✅ Choose from three 2FA methods
- ✅ Easy setup with QR code scanning for authenticator apps
- ✅ Backup codes for account recovery
- ✅ Toggle 2FA on/off from profile settings
- ✅ Change 2FA method anytime
- ✅ Seamless login experience with 2FA verification

### Security Features
- ✅ Time-based One-Time Passwords (TOTP) for authenticator apps
- ✅ Hashed backup codes for secure storage
- ✅ Code expiration for email/SMS codes (10 minutes)
- ✅ Single-use backup codes
- ✅ Clock skew tolerance for TOTP verification

## Architecture

### Backend Components

#### 1. Database Schema (`backend/prisma/schema.prisma`)
Added fields to the User model:
```prisma
twoFactorEnabled      Boolean  @default(false)
twoFactorMethod       String?  // 'email', 'sms', 'authenticator'
twoFactorSecret       String?  // TOTP secret for authenticator
twoFactorPhone        String?  // Phone number for SMS 2FA
twoFactorBackupCodes  String[] // Array of hashed backup codes
twoFactorVerified     Boolean  @default(false)
```

#### 2. 2FA Service (`backend/services/user/services/twoFactorService.ts`)
Core service with functions:
- `setupAuthenticator()` - Generate TOTP secret and QR code
- `verifyAuthenticatorToken()` - Verify TOTP codes
- `enableAuthenticator()` - Enable authenticator 2FA
- `enableEmail2FA()` - Enable email 2FA
- `enableSMS2FA()` - Enable SMS 2FA
- `disable2FA()` - Disable 2FA
- `verify2FACode()` - Universal verification function
- `generateTemporary2FACode()` - Generate codes for email/SMS
- `get2FAStatus()` - Get user's 2FA status
- `regenerateBackupCodes()` - Generate new backup codes

#### 3. API Routes
- `GET /api/2fa/status` - Get 2FA status
- `POST /api/2fa/setup/authenticator` - Setup authenticator
- `POST /api/2fa/enable/authenticator` - Enable authenticator
- `POST /api/2fa/enable/email` - Enable email 2FA
- `POST /api/2fa/enable/sms` - Enable SMS 2FA
- `POST /api/2fa/disable` - Disable 2FA
- `POST /api/2fa/verify` - Verify 2FA code
- `POST /api/2fa/backup-codes` - Regenerate backup codes

### Frontend Components

#### 1. TwoFactorSetupDialog (`src/components/two-factor-setup-dialog.tsx`)
Multi-step dialog for 2FA setup:
- Method selection screen
- Setup screens for each method
- QR code display for authenticator
- Verification input
- Backup codes display and download

#### 2. TwoFactorSettings (`src/components/two-factor-settings.tsx`)
Settings card for the profile page:
- Shows current 2FA status
- Enable/disable toggle
- Change method option
- Integrated with profile page

#### 3. Login Form Updates (`src/components/login-form.tsx`)
- 2FA verification dialog after password login
- Support for authenticator, email, and SMS codes
- Backup code support

## Setup Instructions

### 1. Database Migration
Run Prisma migration to add 2FA fields:
```bash
npx prisma migrate dev --name add_2fa_fields
```

### 2. Dependencies
Already installed:
- `speakeasy` - TOTP generation and verification
- `qrcode` - QR code generation
- `@types/speakeasy` - TypeScript types
- `@types/qrcode` - TypeScript types

### 3. Environment Variables
No additional environment variables required. Uses existing Firebase configuration.

## User Flow

### Setting Up 2FA

1. User navigates to Profile page
2. Scrolls to "Two-Factor Authentication" section
3. Clicks "Enable Two-Factor Authentication"
4. Selects preferred method:
   - **Authenticator**: Scans QR code, enters verification code
   - **Email**: Confirms to use email
   - **SMS**: Enters phone number
5. Views and saves backup codes
6. 2FA is now enabled

### Logging In with 2FA

1. User enters email/username and password
2. System checks if 2FA is enabled
3. If enabled, shows 2FA verification dialog
4. User enters code from:
   - Authenticator app (6-digit TOTP)
   - Email (6-digit code)
   - SMS (6-digit code)
   - Backup code (8-character hex)
5. Upon verification, user is logged in

### Disabling 2FA

1. User navigates to Profile page
2. In "Two-Factor Authentication" section, clicks "Disable 2FA"
3. Confirms the action
4. 2FA is disabled

## Security Considerations

### Best Practices Implemented
✅ Secrets stored in Firebase (not in cookies/localStorage)
✅ Backup codes hashed with SHA-256
✅ TOTP uses 32-character secrets
✅ Time window for TOTP (±2 steps)
✅ Temporary codes expire after 10 minutes
✅ Backup codes are single-use
✅ 2FA required after password verification

### Recommendations
- Implement rate limiting for 2FA verification attempts
- Add IP-based lockout after multiple failed attempts
- Log 2FA events for audit trail
- Consider implementing trusted devices
- Add SMS delivery service (Twilio/SNS) for production
- Add email service for code delivery

## Testing

### Manual Testing Checklist

#### Authenticator Setup
- [ ] Can generate QR code
- [ ] QR code scans correctly in Google Authenticator
- [ ] Manual secret entry works
- [ ] Verification code accepted
- [ ] Backup codes displayed and downloadable
- [ ] 2FA shows as enabled after setup

#### Email 2FA
- [ ] Can enable email 2FA
- [ ] Backup codes generated
- [ ] Status shows email as method

#### SMS 2FA
- [ ] Can enter phone number
- [ ] Can enable SMS 2FA
- [ ] Backup codes generated
- [ ] Status shows SMS as method

#### Login Flow
- [ ] Login without 2FA works normally
- [ ] Login with 2FA shows verification dialog
- [ ] Correct code allows login
- [ ] Incorrect code shows error
- [ ] Backup code works and gets consumed
- [ ] Can cancel 2FA dialog

#### Disabling
- [ ] Can disable 2FA
- [ ] Status updates correctly
- [ ] Login works without 2FA after disabling

#### Changing Methods
- [ ] Can change from one method to another
- [ ] Previous method disabled
- [ ] New method works correctly

## API Integration

### Example: Enable Authenticator 2FA

```typescript
// 1. Setup authenticator
const idToken = await user.getIdToken();
const setupResponse = await fetch('/api/2fa/setup/authenticator', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  },
});
const { secret, qrCodeUrl, backupCodes } = await setupResponse.json();

// 2. User scans QR code and gets verification code

// 3. Enable with verification
const enableResponse = await fetch('/api/2fa/enable/authenticator', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    secret,
    verificationCode: '123456',
    backupCodes,
  }),
});
```

## Future Enhancements

### Planned Features
- [ ] WebAuthn/FIDO2 support (hardware keys)
- [ ] Push notification-based 2FA
- [ ] Trusted devices management
- [ ] 2FA recovery flow without backup codes
- [ ] Admin dashboard for 2FA management
- [ ] 2FA enforcement policies (mandatory for certain accounts)
- [ ] Biometric 2FA on mobile

### Integration Tasks
- [ ] Connect SMS service (Twilio/AWS SNS)
- [ ] Connect email service for code delivery
- [ ] Add to business account settings
- [ ] Add to admin login flow
- [ ] Implement in mobile app

## Troubleshooting

### Common Issues

**Issue**: QR code not displaying
- **Solution**: Check that `qrcode` package is installed and API route is accessible

**Issue**: Codes not verifying
- **Solution**: Check device time sync, verify secret is stored correctly

**Issue**: Backup codes not working
- **Solution**: Ensure codes are properly hashed and compared

**Issue**: 2FA dialog not showing on login
- **Solution**: Check that `twoFactorEnabled` is true in Firestore user document

## Code Maintenance

### Key Files to Monitor
- `/backend/services/user/services/twoFactorService.ts` - Core logic
- `/src/components/two-factor-setup-dialog.tsx` - Setup UI
- `/src/components/two-factor-settings.tsx` - Management UI
- `/src/components/login-form.tsx` - Login integration

### Dependencies to Update
- `speakeasy` - TOTP library
- `qrcode` - QR generation

## Support

For issues or questions:
1. Check this documentation
2. Review implementation in code comments
3. Test with authenticator apps (Google Authenticator recommended)
4. Verify Firebase rules allow reads/writes to user 2FA fields

---

**Implementation Date**: November 4, 2025
**Version**: 1.0.0
**Status**: ✅ Complete and Ready for Testing
