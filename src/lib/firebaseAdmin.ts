import admin from 'firebase-admin';

// Initialize Firebase Admin singleton for server-side usage
export function getAdminApp() {
  if (admin.apps.length > 0) return admin.app();

  // Support multiple env var conventions for service account credentials
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT
    || process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    || (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8')
      : undefined);
  try {
    if (svcJson) {
      const credentials = JSON.parse(svcJson);
      admin.initializeApp({
        credential: admin.credential.cert(credentials as admin.ServiceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // Fall back to ADC in environments that provide it
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
  } catch (e) {
    // Re-throw for observability in API route
    throw new Error(`Firebase Admin init failed: ${(e as Error).message}`);
  }
  return admin.app();
}

export function getAdminDb() {
  return getAdminApp().firestore();
}

export function getAdminStorage() {
  return getAdminApp().storage();
}
