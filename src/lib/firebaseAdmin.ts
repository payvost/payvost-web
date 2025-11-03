import admin from 'firebase-admin';

// Initialize Firebase Admin singleton for server-side usage
export function getAdminApp() {
  if (admin.apps.length > 0) return admin.app();

  try {
    // Support multiple env var conventions for service account credentials
    const serviceAccountEnv = 
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

    let credential: admin.credential.Credential;

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
      // Fall back to ADC in environments that provide it (local dev)
      credential = admin.credential.applicationDefault();
    }

    const config: admin.AppOptions = {
      credential,
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
