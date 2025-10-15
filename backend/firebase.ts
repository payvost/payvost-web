import admin from 'firebase-admin';
import path from 'path';

const serviceAccountPath = path.resolve(__dirname, '..', 'backend/payvost-firebase-adminsdk-d1yhq-da84137a2e.json');

if (!admin.apps.length) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://payvost-default-rtdb.firebaseio.com"
  });
  console.log("Firebase Admin SDK initialized successfully.");
}

export default admin;
