# Android Keystore Generation Guide

This guide explains how to generate an Android keystore file for EAS (Expo Application Services) builds.

## Option 1: Using the Provided Script (Recommended)

### Using Node.js Script (Cross-platform)

```bash
npm run generate-keystore
```

This will prompt you for:
- **Keystore Password**: Minimum 6 characters (save this securely!)
- **Key Alias**: Default is "upload" (you can change it)
- **Key Password**: Press Enter to use the same as keystore password

### Using PowerShell Script (Windows)

```powershell
.\scripts\generate-keystore.ps1
```

## Option 2: Using EAS CLI (Automatic Management)

EAS can automatically generate and manage your credentials:

```bash
npx eas credentials
```

Select "Android" → "Set up a new keystore" and EAS will handle everything automatically.

## Option 3: Manual Generation with keytool

If you prefer to generate it manually:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore payvost-release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- Keystore password
- Key password (can be same as keystore)
- Your name and organizational details

## What You'll Need for EAS Upload

When uploading to EAS dashboard, you'll need:

1. **Keystore File**: `payvost-release.jks` (or `.p12` file)
2. **Keystore Password**: The password you set for the keystore
3. **Key Alias**: Usually "upload" (unless you changed it)
4. **Key Password**: The password for the specific key (can be same as keystore)

## Security Notes

⚠️ **IMPORTANT**: 
- The keystore file is already in `.gitignore` and will NOT be committed to git
- **Save your passwords securely** - you'll need them for all future builds
- If you lose the keystore or passwords, you won't be able to update your app on Google Play Store
- Consider using a password manager to store these credentials

## File Location

The generated keystore will be saved as:
- `mobile/payvost-release.jks`

This file is automatically ignored by git (see `.gitignore`).

## Troubleshooting

### "keytool: command not found"
- Make sure Java JDK is installed
- Add Java bin directory to your PATH
- On Windows, Java is usually at: `C:\Program Files\Java\jdk-*\bin`

### "Keystore was tampered with, or password was incorrect"
- Double-check your passwords
- Make sure you're using the correct keystore file

### Need to change passwords?
You cannot change a keystore password, but you can:
- Generate a new keystore (and update EAS)
- Or use `keytool -storepasswd` to change the store password (but this may break existing builds)

## Next Steps

After generating the keystore:

1. Go to [EAS Dashboard](https://expo.dev/accounts/[your-account]/projects/[your-project]/credentials)
2. Navigate to Android credentials
3. Upload your keystore file
4. Enter the passwords when prompted
5. EAS will use this keystore for all production builds

