# Security Fixes - Immediate Action Plan

## 🚨 URGENT: Do These First (Today)

### 1. Revoke Exposed Firebase Service Account
**File:** `backend/payvost-f28db3f2f0bc.json`

**Steps:**
```bash
# 1. Go to Firebase Console
# 2. Navigate to: Project Settings > Service Accounts
# 3. Find service account: firebase-adminsdk-d1yhq@payvost.iam.gserviceaccount.com
# 4. Click "Delete" or "Revoke Key"
# 5. Generate a new service account key
# 6. Update environment variables with new key
```

**After revoking:**
- Remove file from git history (see step 3)
- Update all deployment environments with new key

---

### 2. Rotate All Exposed API Keys

#### Prisma Database Credentials
**Locations:** 
- `.mdfiles/VERCEL_ENV_VARS.md` line 9
- `.mdfiles/PRISMA_POSTGRES_SETUP.md` line 124
- `.mdfiles/QUICK_START.md` line 137

**⚠️ Multiple different Prisma credentials found - rotate ALL of them**

**Action:**
1. Log into Prisma Accelerate dashboard
2. Identify all exposed API keys
3. Generate new API keys for each
4. Update `DATABASE_URL` in all environments
5. Revoke ALL old keys

#### Fixer.io API Key
**Locations:**
- `.mdfiles/VERCEL_ENV_VARS.md` line 32
- `.mdfiles/OPENEXCHANGE_MIGRATION.md` lines 17, 212
- `.mdfiles/FIXER_INTEGRATION.md` line 112

**Action:**
1. Log into Fixer.io dashboard
2. Generate new API key
3. Update `FIXER_API_KEY` in all environments
4. Revoke old key
5. Update all documentation files

#### Reloadly Credentials
**Location:** `.mdfiles/VERCEL_ENV_VARS.md` lines 37-39

**Action:**
1. Log into Reloadly dashboard
2. Generate new:
   - Client ID
   - Client Secret
   - Webhook Secret
3. Update all three in all environments
4. Revoke old credentials

#### FCM Server Key
**Location:** `.mdfiles/FCM_IMPLEMENTATION_GUIDE.md` line 43

**Action:**
1. Go to Firebase Console > Project Settings > Cloud Messaging
2. Generate new Server Key
3. Update `FCM_SERVER_KEY` in all environments
4. Revoke old server key
5. Update documentation

---

### 3. Remove Sensitive Files from Git History

**⚠️ WARNING:** This rewrites git history. Coordinate with team first!

```bash
# Option 1: Using git filter-branch (if file was recently added)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/payvost-f28db3f2f0bc.json" \
  --prune-empty --tag-name-filter cat -- --all

# Option 2: Using BFG Repo-Cleaner (recommended for large repos)
# Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files payvost-f28db3f2f0bc.json
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Option 3: Using git-filter-repo (modern alternative)
git filter-repo --path backend/payvost-f28db3f2f0bc.json --invert-paths
```

**After cleaning:**
```bash
# Force push (coordinate with team!)
git push origin --force --all
git push origin --force --tags
```

**Verify:**
```bash
# Check that file is removed from history
git log --all --full-history -- backend/payvost-f28db3f2f0bc.json
# Should return nothing
```

---

### 4. Sanitize Documentation Files

**Files to sanitize:**
- `.mdfiles/VERCEL_ENV_VARS.md`
- `.mdfiles/PRISMA_POSTGRES_SETUP.md`
- `.mdfiles/QUICK_START.md`
- `.mdfiles/OPENEXCHANGE_MIGRATION.md`
- `.mdfiles/FIXER_INTEGRATION.md`
- `.mdfiles/FCM_IMPLEMENTATION_GUIDE.md`

**Replace actual keys with placeholders:**

```markdown
# BEFORE (EXPOSED):
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGc...
FIXER_API_KEY=228793b424835fd85f1ca3d53d11d552
Server Key: AAAAzXnyRGQ:APA91bH7JWx07PnIHKC-gWBZ5z0teUIFjFVrUqgdN5bIIi1yUVcNrjV2a1vBw-_YkZk-4U3iU0ZYRJBVsoRYKG4719kTrBSx_5LsODxHwFJo82OK3fs9-bIrrmxd5g2kgPSn1CvE28D1

# AFTER (SAFE):
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=<your-prisma-api-key>
FIXER_API_KEY=<your-fixer-api-key>
Server Key: <your-fcm-server-key>
```

**Do this for ALL exposed keys in ALL documentation files:**
- DATABASE_URL (multiple files)
- FIXER_API_KEY (multiple files)
- RELOADLY_CLIENT_ID
- RELOADLY_CLIENT_SECRET
- RELOADLY_WEBHOOK_SECRET
- FCM Server Key

---

### 5. Change JWT Secret

**File:** `backend/gateway/middleware.ts`

**Current:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
```

**Fix:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'changeme') {
  throw new Error('JWT_SECRET must be set and cannot be "changeme"');
}
```

**Generate new secret:**
```bash
# Generate strong random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Update:**
- Set `JWT_SECRET` in all environment variables
- Invalidate all existing JWT tokens (users will need to re-login)

---

## 📅 This Week (Priority 2)

### 6. Fix CORS Configuration

**File:** `backend/gateway/index.ts` line 129

**Current:**
```typescript
origin: process.env.FRONTEND_URL || '*',
```

**Fix:**
```typescript
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
  : [];

if (allowedOrigins.length === 0) {
  throw new Error('FRONTEND_URL must be set in production');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  // ... rest of config
}));
```

---

### 7. Move Hardcoded Firebase Keys to Environment Variables

**Files to fix:**
- `mobile/app.config.js`
- `public/firebase-messaging-sw.js`
- `firebase.json`

**Example fix for `mobile/app.config.js`:**
```javascript
export default {
  expo: {
    web: {
      config: {
        firebase: {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          // ... other config from env
        },
      },
    },
  },
};
```

**For `public/firebase-messaging-sw.js`:**
- This is a service worker, so it can't use `process.env` directly
- Use build-time replacement or fetch config from API
- Or use a config endpoint that returns Firebase config

---

### 8. Remove Hardcoded FCM VAPID Key

**File:** `src/lib/fcm.ts` line 10

**Current:**
```typescript
const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || 'BAKeRtjRfqpfK7Mb0Q4HhlH7iJcITKQF6-5zsdGyDjY56ZeK7CCcvKE23YvFPWUKcSqT8hMZE1ZBWwEeFILPv5M';
```

**Fix:**
```typescript
const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
if (!VAPID_KEY) {
  throw new Error('NEXT_PUBLIC_FCM_VAPID_KEY must be set');
}
```

---

### 9. Implement Input Sanitization

**Install:**
```bash
npm install dompurify sanitize-html
npm install --save-dev @types/dompurify
```

**Create sanitization utility:**
```typescript
// src/utils/sanitize.ts
import DOMPurify from 'dompurify';
import sanitizeHtml from 'sanitize-html';

export function sanitizeInput(input: string): string {
  // For HTML content
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p'],
    allowedAttributes: {
      'a': ['href']
    }
  });
}

export function sanitizeText(input: string): string {
  // For plain text (strip all HTML)
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}
```

**Use in forms:**
```typescript
import { sanitizeInput } from '@/utils/sanitize';

const cleanInput = sanitizeInput(userInput);
```

---

### 10. Add Security Headers

**File:** `backend/gateway/index.ts`

**Enhanced Helmet config:**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

---

## 📅 This Month (Priority 3)

### 11. Set Up Secret Scanning

**Install git-secrets:**
```bash
# macOS
brew install git-secrets

# Linux
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
sudo make install
```

**Configure:**
```bash
cd /path/to/payvost-web
git secrets --install
git secrets --register-aws
git secrets --add 'AIza[0-9A-Za-z_-]{35}'
git secrets --add 'sk_[0-9A-Za-z]{32,}'
git secrets --add '-----BEGIN PRIVATE KEY-----'
```

**Add to CI/CD:**
```yaml
# .github/workflows/security.yml
- name: Scan for secrets
  run: |
    git secrets --scan
    # Or use GitGuardian, TruffleHog, etc.
```

---

### 12. Verify Password Hashing

**Check implementation:**
```typescript
// Should use bcrypt or argon2
import bcrypt from 'bcrypt';

// Hashing
const hashedPassword = await bcrypt.hash(password, 10);

// Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

**If not implemented:**
1. Add password hashing to registration/login
2. Migrate existing passwords (require reset)
3. Implement password strength requirements

---

### 13. Add Rate Limiting Verification

**Verify all endpoints are protected:**
```typescript
// backend/gateway/index.ts
// Add to sensitive routes:
router.post('/api/auth/reset-password', authLimiter, resetPasswordHandler);
router.post('/api/auth/verify-email', authLimiter, verifyEmailHandler);
router.post('/api/keys/generate', authLimiter, generateApiKeyHandler);
```

---

## ✅ Verification Steps

After implementing fixes:

1. **Test secret scanning:**
   ```bash
   git secrets --scan
   ```

2. **Check for exposed keys:**
   ```bash
   grep -r "AIza" --exclude-dir=node_modules .
   grep -r "sk_" --exclude-dir=node_modules .
   grep -r "BEGIN PRIVATE KEY" --exclude-dir=node_modules .
   ```

3. **Verify environment variables:**
   ```bash
   # Check all required vars are set
   node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET ? 'OK' : 'MISSING')"
   ```

4. **Test CORS:**
   - Try accessing API from unauthorized origin
   - Should be blocked

5. **Test input sanitization:**
   - Try submitting XSS payloads
   - Should be sanitized

---

## 📞 Need Help?

If you need assistance with any of these fixes:
1. Review the detailed `SECURITY_AUDIT_REPORT.md`
2. Consult OWASP guidelines
3. Consider engaging a security consultant for critical fixes

---

**Last Updated:** January 2025  
**Status:** 🔴 Critical issues require immediate attention

