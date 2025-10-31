import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Single, robust initializer for firebase-admin.
// Supports both environment variable (production) and local file (development).

const LOCAL_SA_FILENAME = 'payvost-ae91662ec061.json';

function initFirebaseAdmin() {
  if (admin.apps.length) return admin;

  try {
    let credential;

    // Check if we're in production and have the service account as env var
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('Firebase Admin initialized using environment variable');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
    } else {
      // Development: use local file
      const serviceAccountPath = path.resolve(process.cwd(), 'backend', LOCAL_SA_FILENAME);
      
      if (!fs.existsSync(serviceAccountPath)) {
        console.warn(`No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_KEY or place ${LOCAL_SA_FILENAME} in the backend folder.`);
        return admin;
      }

      console.log(`Firebase Admin initialized using local key: ${LOCAL_SA_FILENAME}`);
      const raw = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(raw);
      credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
    }

    admin.initializeApp({
      credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    
    return admin;
  } catch (err) {
    console.error('Failed to initialize firebase-admin:', err instanceof Error ? err.message : String(err));
    throw err;
  }
}

initFirebaseAdmin();

export default admin;
