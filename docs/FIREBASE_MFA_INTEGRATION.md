# Two-Factor Authentication (2FA) Integration

## Overview

This implementation uses **Firebase Multi-Factor Authentication (MFA)** which provides:

✅ **Built-in Email Notifications** - Firebase automatically sends emails when:
- User enrolls in MFA
- User signs in with MFA  
- MFA is removed from account

✅ **Secure Server-Side Verification** - All MFA verification happens server-side via Firebase Auth

✅ **Support for Multiple Methods**:
- **TOTP (Authenticator Apps)** - Google Authenticator, Authy, etc.
- **SMS** - Text message codes (requires Firebase Blaze plan & phone provider setup)

## How It Works

### 1. MFA Enrollment (Client-Side)

Users enroll in MFA through the Firebase client SDK:

\`\`\`typescript
import { multiFactor, TotpMultiFactorGenerator, TotpSecret } from 'firebase/auth';

// Step 1: Generate TOTP secret
const multiFactorSession = await multiFactor(user).getSession();
const totpSecret = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);

// Step 2: Display QR code to user
const qrCodeUrl = totpSecret.generateQrCodeUrl(user.email, 'Payvost');

// Step 3: User scans QR code and enters verification code
const verificationCode = '123456'; // From user's authenticator app

// Step 4: Enroll the factor
const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
  totpSecret,
  verificationCode
);
await multiFactor(user).enroll(multiFactorAssertion, 'My Authenticator');
\`\`\`

**Firebase automatically sends an enrollment confirmation email** to the user's registered email address.

### 2. MFA Verification During Sign-In

When a user with MFA tries to sign in:

\`\`\`typescript
import { signInWithEmailAndPassword, multiFactor, TotpMultiFactorGenerator } from 'firebase/auth';

try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error: any) {
  if (error.code === 'auth/multi-factor-auth-required') {
    const resolver = error.resolver;
    
    // Check which factor the user has enrolled
    const hints = resolver.hints;
    const selectedHint = hints[0]; // TOTP or Phone
    
    if (selectedHint.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
      // User needs to enter TOTP code
      const verificationCode = prompt('Enter code from authenticator app');
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(
        selectedHint.uid,
        verificationCode
      );
      await resolver.resolveSignIn(assertion);
    }
  }
}
\`\`\`

### 3. MFA Management

#### Unenroll from MFA
\`\`\`typescript
const enrolledFactors = multiFactor(user).enrolledFactors;
if (enrolledFactors.length > 0) {
  await multiFactor(user).unenroll(enrolledFactors[0]);
  // Firebase sends unenrollment notification email automatically
}
\`\`\`

## Email Notifications

Firebase automatically sends these emails (configured in Firebase Console):

### 1. **Multi-factor enrollment notification**
- **When**: User adds MFA to their account
- **Template**: Customizable in Firebase Console > Authentication > Templates
- **Default Subject**: "You've added 2 step verification to your %APP_NAME% account"

### 2. **Multi-factor unenrollment notification**  
- **When**: MFA is removed from account
- **Template**: Customizable in Firebase Console

### 3. **Sign-in verification**
- **When**: User signs in with MFA (optional, can be enabled)

## Configuration in Firebase Console

### Enable MFA in Firebase

1. Go to **Firebase Console** > **Authentication** > **Sign-in method**
2. Click on **Advanced** section
3. Enable **Multi-factor authentication**
4. Choose allowed methods:
   - ☑️ **TOTP** (Authenticator apps) - Always available
   - ☑️ **SMS** - Requires Blaze plan + phone provider setup

### Customize Email Templates

1. Go to **Firebase Console** > **Authentication** > **Templates**
2. Select **Multi-factor enrollment notification**
3. Customize:
   - Sender name
   - From email (requires custom domain verification)
   - Subject line
   - Message body

Available template variables:
- `%APP_NAME%` - Your app name
- `%DISPLAY_NAME%` - User's display name
- `%SECOND_FACTOR%` - The type of 2FA (TOTP, SMS)

## API Endpoints

### GET `/api/2fa/status`
Get user's current MFA status

**Response:**
\`\`\`json
{
  "enabled": true,
  "method": "authenticator",
  "verified": true,
  "hasBackupCodes": false
}
\`\`\`

### POST `/api/2fa/enable/authenticator`
Record TOTP enrollment after client-side completion

**Request:**
\`\`\`json
{
  "displayName": "My Authenticator"
}
\`\`\`

### POST `/api/2fa/enable/sms`
Record SMS enrollment after client-side completion

**Request:**
\`\`\`json
{
  "phoneNumber": "+1234567890"
}
\`\`\`

### POST `/api/2fa/disable`
Record MFA unenrollment in Firestore

## Database Schema

Firestore `/users/{userId}` stores MFA status for quick access:

\`\`\`typescript
{
  twoFactorEnabled: boolean;
  twoFactorMethod: 'authenticator' | 'sms' | null;
  twoFactorVerified: boolean;
  twoFactorEnrolledAt: Timestamp;
  twoFactorDisplayName: string;
}
\`\`\`

**Note**: The source of truth is Firebase Auth. Firestore is used for display/UI purposes only.

## UI Components

### `<TwoFactorSettings />`
Main component for managing MFA in user profile
- Located in: `src/components/two-factor-settings.tsx`
- Shows current MFA status
- Allows enabling/disabling MFA
- Opens setup dialog

### `<TwoFactorSetupDialog />`
Modal dialog for MFA enrollment
- Located in: `src/components/two-factor-setup-dialog.tsx`
- Walks user through enrollment process
- Displays QR code for TOTP
- Handles verification

## Security Considerations

✅ **No backup codes needed** - Firebase handles account recovery through email

✅ **Server-side verification** - All MFA checks happen on Firebase servers

✅ **Rate limiting** - Firebase automatically rate-limits verification attempts

✅ **Secure storage** - TOTP secrets never leave Firebase infrastructure

⚠️ **SMS costs** - SMS MFA requires Firebase Blaze plan and incurs charges per SMS

## Testing

### Test TOTP Enrollment

1. Sign in to your test account
2. Go to Profile > Security
3. Click "Enable Two-Factor Authentication"
4. Choose "Authenticator App"
5. Scan QR code with Google Authenticator
6. Enter 6-digit code
7. ✅ Check email for enrollment confirmation

### Test MFA Sign-In

1. Sign out
2. Sign in with email/password
3. Should prompt for 2FA code
4. Enter code from authenticator app
5. ✅ Successfully signs in

### Test Unenrollment

1. Go to Profile > Security
2. Click "Disable 2FA"
3. Confirm action
4. ✅ Check email for unenrollment notification

## Troubleshooting

### Email notifications not sending

1. Check Firebase Console > Authentication > Templates
2. Verify email template is enabled
3. Check spam folder
4. For custom domains, verify domain is confirmed

### SMS not working

1. Ensure Firebase Blaze plan is active
2. Configure phone provider in Firebase Console
3. Check phone number format (must include +country code)
4. Verify SMS budget not exceeded

### TOTP codes not working

1. Ensure device time is synchronized
2. Check time zone settings
3. Code expires every 30 seconds
4. Try next code if timing is off

## Migration from Custom 2FA

If migrating from a custom 2FA implementation:

1. Users will need to re-enroll in MFA using Firebase
2. Old backup codes/secrets can be safely deleted
3. Update all sign-in flows to use Firebase MFA resolver
4. Test thoroughly before removing old 2FA code

## References

- [Firebase MFA Documentation](https://firebase.google.com/docs/auth/web/multi-factor)
- [TOTP Multi-Factor Authentication](https://firebase.google.com/docs/auth/web/multi-factor#totp-multi-factor-authentication)
- [Email Template Customization](https://firebase.google.com/docs/auth/custom-email-handler)
