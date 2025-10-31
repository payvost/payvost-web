import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Firebase Admin SDK initialization for Next.js API routes
// Supports both environment variable (production/Vercel) and local file (development)

const LOCAL_SA_FILENAME = 'payvost-ae91662ec061.json';

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  try {
    let credential;

    // Check if we're in production (Vercel) and have the service account as env var
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('Firebase Admin SDK: Using service account from environment variable');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
    } else {
      // Development: use local file
      const serviceAccountPath = path.resolve(process.cwd(), 'backend', LOCAL_SA_FILENAME);
      
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Service account file not found at: ${serviceAccountPath}`);
      }

      console.log(`Firebase Admin SDK: Using local service account file: ${LOCAL_SA_FILENAME}`);
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
    }
    
    admin.initializeApp({
      credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://payvost-default-rtdb.firebaseio.com"
    });
    
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

initFirebaseAdmin();

export const db = admin.firestore();
export const auth = admin.auth();
