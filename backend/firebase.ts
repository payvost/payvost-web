import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Single, robust initializer for firebase-admin.
// Prefers Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS).
// Falls back to the local service account file packaged under backend/.

const LOCAL_SA_FILENAME = 'payvost-firebase-adminsdk-d1yhq-da84137a2e.json';

function initFirebaseAdmin() {
  if (admin.apps.length) return admin;

  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
      console.log('Firebase Admin initialized using GOOGLE_APPLICATION_CREDENTIALS');
      return admin;
    }

  // Resolve the service-account path relative to the project root so this works in both ESM and CJS
  const candidatePath = path.resolve(process.cwd(), 'backend', LOCAL_SA_FILENAME);
  if (fs.existsSync(candidatePath)) {
      // Use a file read + JSON.parse so behavior is consistent across ts-node and compiled JS
  const raw = fs.readFileSync(candidatePath, 'utf8');
      const serviceAccount = JSON.parse(raw);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
      console.log(`Firebase Admin initialized using local key: ${LOCAL_SA_FILENAME}`);
      return admin;
    }

    console.warn(
      `No Firebase credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or place ${LOCAL_SA_FILENAME} in the backend folder.`
    );
    // Initialize without credentials will still allow some admin operations to fail later; return admin namespace.
    return admin;
  } catch (err) {
    console.error('Failed to initialize firebase-admin:', err instanceof Error ? err.message : String(err));
    throw err;
  }
}

initFirebaseAdmin();

export default admin;
