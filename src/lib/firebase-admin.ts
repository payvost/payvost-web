import admin from 'firebase-admin';
import path from 'path';

// This path is relative to the location of the compiled file in .next/server/
// Adjust if your deployment structure is different.
const serviceAccountPath = path.resolve(process.cwd(), 'qwibil-remit-firebase-adminsdk-fbsvc-9ffb02d58c.json');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      databaseURL: "https://qwibil-remit-default-rtdb.firebaseio.com"
    });
    console.log("Firebase Admin SDK initialized successfully for API routes.");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK for API routes:", error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
