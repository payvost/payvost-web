import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Firebase Admin SDK initialization for Next.js API routes
// Supports both environment variable (production/Vercel) and local file (development)

const LOCAL_SA_FILENAME = 'payvost-f28db3f2f0bc.json';

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  try {
    let credential;

    // Prefer environment variables in hosted environments
    const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const envB64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

    if (envJson || envB64) {
      console.log('Firebase Admin SDK: Using service account from environment variable');
      let parsed: any;
      try {
        const raw = envJson ?? Buffer.from(envB64 as string, 'base64').toString('utf8');
        parsed = JSON.parse(raw);
      } catch (e: any) {
        const hint = `Invalid FIREBASE_SERVICE_ACCOUNT_KEY$${envB64 ? '_BASE64' : ''}. Ensure it's valid JSON${envB64 ? ' after base64 decoding' : ''}.`;
        throw new Error(`${hint} Original error: ${e?.message || e}`);
      }

      // Normalize private_key newlines if they are escaped ("\\n")
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      credential = admin.credential.cert(parsed as admin.ServiceAccount);
    } else {
      // Development: use local file - try multiple possible paths
      const possiblePaths = [
        path.resolve(process.cwd(), 'backend', LOCAL_SA_FILENAME),
        path.resolve(process.cwd(), LOCAL_SA_FILENAME),
        path.resolve(__dirname, '..', '..', 'backend', LOCAL_SA_FILENAME),
      ];
      
      console.log('Firebase Admin SDK: Looking for service account file');
      console.log('Firebase Admin SDK: Current working directory:', process.cwd());
      console.log('Firebase Admin SDK: __dirname:', __dirname);
      
      let serviceAccountPath: string | null = null;
      for (const tryPath of possiblePaths) {
        console.log('Firebase Admin SDK: Trying path:', tryPath);
        if (fs.existsSync(tryPath)) {
          serviceAccountPath = tryPath;
          console.log('Firebase Admin SDK: Found service account at:', tryPath);
          break;
        }
      }
      
      if (!serviceAccountPath) {
        console.error('Firebase Admin SDK: Service account file not found in any of the expected locations');
        console.error('Firebase Admin SDK: Tried paths:', possiblePaths);
        throw new Error(`Service account file not found. Tried: ${possiblePaths.join(', ')}`);
      }

      console.log(`Firebase Admin SDK: Using local service account file: ${serviceAccountPath}`);
      const fileContents = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(fileContents);
      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
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

// New explicit exports
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

// Backward compatibility exports for existing API routes
export const db = adminDb;
export const auth = adminAuth;

export { admin };
