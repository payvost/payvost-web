
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, Firestore, FirestoreError } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics, logEvent } from "firebase/analytics"; // ✅ Added
import { errorEmitter } from "./error-emitter";
import { FirestorePermissionError } from "./errors";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // ✅ Added
};

// Validate that all required Firebase config values are present.
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    const envVarKey = `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
    throw new Error(
      `Firebase config is missing a value for "${key}". Please check your environment variable ${envVarKey}.`
    );
  }
});

// --- Initialize Firebase ---
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Debug: print project id at runtime to help confirm client is using the expected Firebase project
try {
  if (typeof window !== 'undefined') {
    // In client, print the app options (project id) to the console
    // eslint-disable-next-line no-console
    console.log('Firebase initialized (client) projectId:', app.options?.projectId || firebaseConfig.projectId);
  } else {
    // Server-side log
    // eslint-disable-next-line no-console
    console.log('Firebase initialized (server) projectId:', app.options?.projectId || firebaseConfig.projectId);
  }
} catch (err) {
  // ignore
}

// --- Initialize Analytics (client-side only) ---
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("✅ Firebase Analytics initialized");
    } else {
      console.warn("⚠️ Firebase Analytics not supported in this environment.");
    }
  });
}

// --- Global Firestore Permission Error Handling ---
if (typeof window !== 'undefined') {
  errorEmitter.on('permission-error', (error: FirestorePermissionError) => {
    console.error("Caught Firestore Permission Error:", error.toString());
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        throw error;
      }, 0);
    }
  });
}

export { app, auth, db, storage, analytics, logEvent, FirestoreError, signInWithCustomToken };
