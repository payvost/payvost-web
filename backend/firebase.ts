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

    const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const envB64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

    if (envJson || envB64) {
      console.log('Firebase Admin initialized using environment variable');
      let parsed: any;
      try {
        const raw = envJson ?? Buffer.from(envB64 as string, 'base64').toString('utf8');
        parsed = JSON.parse(raw);
      } catch (e: any) {
        const hint = `Invalid FIREBASE_SERVICE_ACCOUNT_KEY$${envB64 ? '_BASE64' : ''}. Ensure it's valid JSON${envB64 ? ' after base64 decoding' : ''}.`;
        throw new Error(`${hint} Original error: ${e?.message || e}`);
      }
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      credential = admin.credential.cert(parsed as admin.ServiceAccount);
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
      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
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
