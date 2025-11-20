import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Firebase Admin SDK initialization for Next.js API routes
// Supports both environment variable (production/Vercel) and local file (development)

const LOCAL_SA_FILENAME = 'payvost-f28db3f2f0bc.json';

let initialized = false;

function initFirebaseAdmin() {
  if (admin.apps.length) {
    initialized = true;
    return;
  }

  // Skip initialization during build time (Next.js build process)
  // Check for build phase or if we're in a build context without credentials
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-export' ||
                       (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 && !fs.existsSync(path.resolve(process.cwd(), 'backend', LOCAL_SA_FILENAME)));
  
  if (isBuildPhase) {
    console.warn('Firebase Admin SDK: Skipping initialization during build phase');
    return;
  }

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
      
      let serviceAccountPath: string | null = null;
      for (const tryPath of possiblePaths) {
        if (fs.existsSync(tryPath)) {
          serviceAccountPath = tryPath;
          break;
        }
      }
      
      if (!serviceAccountPath) {
        // During build, just warn instead of throwing
        const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_PHASE === 'phase-export';
        if (isBuildPhase) {
          console.warn('Firebase Admin SDK: Service account file not found during build. This is expected in CI/CD.');
          return;
        }
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
    
    initialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    // During build, just warn instead of throwing
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_PHASE === 'phase-export';
    if (isBuildPhase) {
      console.warn("Firebase Admin SDK: Failed to initialize during build (this is expected):", error);
      return;
    }
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

// Lazy initialization - only initialize when actually needed
function ensureInitialized() {
  if (!initialized && !admin.apps.length) {
    initFirebaseAdmin();
  }
}

// Try to initialize, but don't fail during build
initFirebaseAdmin();

// Lazy getters that ensure initialization
function getAdminDb() {
  ensureInitialized();
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK not initialized. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable or provide service account file.');
  }
  return admin.firestore();
}

function getAdminAuth() {
  ensureInitialized();
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK not initialized. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable or provide service account file.');
  }
  return admin.auth();
}

// New explicit exports with lazy initialization using Proxy
export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    const value = db[prop as keyof admin.firestore.Firestore];
    return typeof value === 'function' ? value.bind(db) : value;
  }
});

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop) {
    const auth = getAdminAuth();
    const value = auth[prop as keyof admin.auth.Auth];
    return typeof value === 'function' ? value.bind(auth) : value;
  }
});

// Backward compatibility exports for existing API routes
export const db = adminDb;
export const auth = adminAuth;

export { admin };
