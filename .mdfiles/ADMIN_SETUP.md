# Admin Role Setup Guide

This guide explains how to grant admin access to users in your Payvost application. Admin users have access to the admin dashboard at `/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard`.

## Prerequisites

- User must already be registered in Firebase Authentication
- You need access to Firebase Console or Firebase CLI with admin privileges
- Firebase project: Your Payvost project

## Admin Role System

The application supports two admin roles stored in the Firestore `users` collection:

- **`admin`**: Standard administrator with full dashboard access
- **`super_admin`**: Super administrator with elevated privileges

## Method 1: Firebase Console (Recommended for First Setup)

### Step 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Payvost project
3. Navigate to **Firestore Database** in the left sidebar

### Step 2: Find the User Document

1. In Firestore, locate the `users` collection
2. Find the document for the user you want to make an admin
   - The document ID should match the user's Firebase Authentication UID
3. Click on the document to open it

### Step 3: Add Admin Role

1. Click **"Add field"** button
2. Set the field details:
   - **Field name**: `role`
   - **Type**: `string`
   - **Value**: `admin` (or `super_admin` for super admin)
3. Click **"Update"**

### Verification

The user should now be able to:
1. Log in at `/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/login`
2. Access the admin dashboard
3. See audit logs in the `adminAuditLog` collection

---

## Method 2: Firebase CLI (Programmatic Approach)

### Prerequisites
```bash
npm install -g firebase-tools
firebase login
```

### Create Script: `scripts/set-admin-role.js`

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../backend/payvost-ae91662ec061.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setAdminRole(email, role = 'admin') {
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    // Update Firestore user document
    await db.collection('users').doc(uid).update({
      role: role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Successfully set role "${role}" for user: ${email} (${uid})`);
    
    // Log the action
    await db.collection('adminAuditLog').add({
      uid: uid,
      email: email,
      action: 'role_assigned',
      role: role,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        assignedBy: 'system_script'
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin role:', error.message);
    process.exit(1);
  }
}

// Get email and role from command line
const email = process.argv[2];
const role = process.argv[3] || 'admin';

if (!email) {
  console.error('Usage: node set-admin-role.js <email> [role]');
  console.error('Example: node set-admin-role.js admin@payvost.com admin');
  process.exit(1);
}

setAdminRole(email, role);
```

### Run the Script

```bash
# Grant admin role
node scripts/set-admin-role.js admin@payvost.com admin

# Grant super_admin role
node scripts/set-admin-role.js ceo@payvost.com super_admin
```

---

## Method 3: Firebase Admin SDK (In Your Backend)

If you need to programmatically assign roles from your backend:

### Create API Endpoint: `src/app/api/admin/grant-role/route.ts`

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-helpers";
import { cookies } from "next/headers";
import { auth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    // Verify requesting user is admin
    const sessionCookie = cookies().get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    await requireAdmin(decodedClaims.uid);

    // Get target user and role from request
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    if (!["admin", "super_admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'super_admin'" },
        { status: 400 }
      );
    }

    // Get target user by email
    const userRecord = await auth.getUserByEmail(email);
    const targetUid = userRecord.uid;

    // Update user role in Firestore
    await db.collection("users").doc(targetUid).update({
      role: role,
      updatedAt: new Date().toISOString(),
    });

    // Log the action
    await db.collection("adminAuditLog").add({
      uid: targetUid,
      email: email,
      action: "role_assigned",
      role: role,
      timestamp: new Date().toISOString(),
      assignedBy: decodedClaims.uid,
      assignedByEmail: decodedClaims.email,
    });

    return NextResponse.json({
      success: true,
      message: `Role "${role}" assigned to ${email}`,
      uid: targetUid,
    });
  } catch (error: any) {
    console.error("Error granting role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to grant role" },
      { status: 500 }
    );
  }
}
```

### Usage

```bash
# Using curl
curl -X POST http://localhost:3000/api/admin/grant-role \
  -H "Content-Type: application/json" \
  -b "session=YOUR_SESSION_COOKIE" \
  -d '{
    "email": "newadmin@payvost.com",
    "role": "admin"
  }'
```

---

## Verifying Admin Access

### 1. Check Firestore

1. Open Firebase Console → Firestore Database
2. Navigate to `users/{uid}`
3. Verify the `role` field exists and is set to `admin` or `super_admin`

### 2. Test Login

1. Navigate to `/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/login`
2. Enter the admin user's credentials
3. Should successfully log in and redirect to dashboard
4. Non-admin users should see "Access denied. You do not have admin privileges"

### 3. Check Audit Logs

Admin actions are logged in the `adminAuditLog` collection:

```typescript
// Example audit log document
{
  uid: "user_uid",
  email: "admin@payvost.com",
  action: "admin_login",
  timestamp: "2024-01-15T10:30:00.000Z",
  metadata: {
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0..."
  }
}
```

---

## Security Best Practices

### 1. Limit Admin Accounts

- Only grant admin access to trusted personnel
- Use `admin` role for general administrators
- Reserve `super_admin` for organization leadership

### 2. Regular Audits

Monitor the `adminAuditLog` collection for:
- Unauthorized access attempts
- Unusual activity patterns
- Failed login attempts

### 3. Role Removal

To revoke admin access:

**Firebase Console:**
1. Go to Firestore → `users/{uid}`
2. Find the `role` field
3. Click delete or change to `user`

**CLI Script:**
```javascript
await db.collection('users').doc(uid).update({
  role: admin.firestore.FieldValue.delete()
});
```

### 4. Multi-Factor Authentication

For production, consider adding MFA for admin accounts:
```bash
# Firebase Console → Authentication → Sign-in method → Multi-factor authentication
```

---

## Troubleshooting

### "Access denied" after setting role

**Check:**
1. Firestore `users` collection has document with user's UID
2. Document contains `role: "admin"` or `role: "super_admin"`
3. User is signing in with correct email/password
4. Session cookie is being created (check browser dev tools → Application → Cookies)

**Solution:**
```bash
# Verify in Firebase CLI
firebase firestore:get users/{uid}
```

### Admin can't access specific pages

**Check middleware:**
- `/src/middleware.ts` should include admin path in matcher
- Session cookie verification should pass
- `isAdmin()` function should return true

### Session expires immediately

**Check:**
- Cookie settings in `/src/app/api/auth/session/route.ts`
- `expiresIn` should be `60 * 60 * 24 * 14 * 1000` (14 days)
- `httpOnly` and `secure` flags should be set correctly

---

## Environment-Specific Setup

### Local Development

1. Use Method 1 (Firebase Console) for quick setup
2. Service account file: `backend/payvost-ae91662ec061.json`

### Production (Vercel)

1. Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` env var is set
2. Use Method 3 (API endpoint) for programmatic role assignment
3. Audit logs are automatically created

---

## Quick Reference

| Role | Access Level | Use Case |
|------|-------------|----------|
| `admin` | Full dashboard access | General administrators, support staff |
| `super_admin` | Elevated privileges | CEO, CTO, senior management |
| (no role) | Regular user | Standard application users |

---

## Need Help?

If you encounter issues:
1. Check Firebase Console → Authentication (user exists?)
2. Check Firestore → `users/{uid}` (role field exists?)
3. Check browser console for errors
4. Review `adminAuditLog` collection for access attempts

For additional support, contact the development team.
