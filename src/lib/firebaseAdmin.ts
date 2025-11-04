import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin singleton for server-side usage
export function getAdminApp() {
  if (admin.apps.length > 0) return admin.app();

  try {
    // Support multiple env var conventions for service account credentials
    const serviceAccountEnv = 
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

    let credential: admin.credential.Credential | null = null;

    if (serviceAccountEnv) {
      let serviceAccount: any;

      // Check if it's base64 encoded
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
        const decoded = Buffer.from(serviceAccountEnv, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decoded);
      } 
      // Check if it's already a JSON object (Vercel might parse it automatically)
      else if (typeof serviceAccountEnv === 'object') {
        serviceAccount = serviceAccountEnv;
      }
      // Otherwise it's a JSON string that needs parsing
      else {
        serviceAccount = JSON.parse(serviceAccountEnv);
      }

      credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
    } else {
      // Fallbacks for local/dev without env var:
      // 1) Try known service account files in repo
      const candidates = [
        path.resolve(process.cwd(), 'backend', 'payvost-ae91662ec061.json'),
        path.resolve(process.cwd(), 'functions', 'serviceAccountKey.json'),
      ];
      let loadedFromFile = false;
      for (const filePath of candidates) {
        try {
          if (fs.existsSync(filePath)) {
            console.log('[firebaseAdmin] Attempting file:', filePath);
            const raw = fs.readFileSync(filePath, 'utf-8');
            const svc = JSON.parse(raw);
            credential = admin.credential.cert(svc as admin.ServiceAccount);
            loadedFromFile = true;
            console.log('[firebaseAdmin] Loaded from file:', filePath);
            break;
          }
        } catch (err) {
          console.error('[firebaseAdmin] Failed to load', filePath, err);
          // continue
        }
      }

      if (!loadedFromFile) {
        // 2) Fall back to ADC in environments that provide it
        credential = admin.credential.applicationDefault();
      }
    }

    // Ensure we have a credential
    if (!credential) {
      credential = admin.credential.applicationDefault();
    }

    const config: admin.AppOptions = {
      credential: credential,
    };

    // Add storage bucket if provided
    if (process.env.FIREBASE_STORAGE_BUCKET) {
      config.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    }

    admin.initializeApp(config);
    return admin.app();
  } catch (e) {
    // Re-throw for observability in API route
    throw new Error(`Firebase Admin init failed: ${(e as Error).message}`);
  }
}

export function getAdminDb() {
  return getAdminApp().firestore();
}

export function getAdminStorage() {
  return getAdminApp().storage();
}
