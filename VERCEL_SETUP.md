# Quick Setup: Firebase Service Account for Vercel

## Get Your Service Account JSON

```bash
cat backend/payvost-ae91662ec061.json
```

Copy the entire output (including the outer `{` and `}`).

## Add to Vercel Dashboard

1. Go to https://vercel.com/[your-username]/[your-project]/settings/environment-variables

2. Click **Add New**

3. Set:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value:** Paste the entire JSON (can be minified or formatted)
   - **Environment:** Select all (Production, Preview, Development)

4. Click **Save**

5. **Redeploy** your application for changes to take effect

## Example Value Format

The value should look like this (minified):

```json
{"type":"service_account","project_id":"payvost","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

Or formatted (Vercel handles both):

```json
{
  "type": "service_account",
  "project_id": "payvost",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

## Verify Setup

After deployment, check your Vercel logs for:

```
✅ Firebase Admin SDK: Using service account from environment variable
✅ Firebase Admin SDK initialized successfully
```

You should NOT see:
```
❌ Service account file not found
```

## Other Required Environment Variables

Also add these to Vercel:

```
FIREBASE_DATABASE_URL=https://payvost-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAn3lOhpdEjorQhKuGzW333lq3HSuaroSQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=payvost.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=payvost
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=payvost.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=882514216036
NEXT_PUBLIC_FIREBASE_APP_ID=1:882514216036:web:1ff4f7cbc9a3de3c3dcb71
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-0S2JJFY1SR
```

(Copy these from your .env.local file)
