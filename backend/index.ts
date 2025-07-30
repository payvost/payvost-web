
import express from 'express';
import admin from 'firebase-admin';
import path from 'path';
import cors from 'cors'; 
import userRoutes from './services/user/routes/userRoutes'; // Import user routes

// Correctly resolve the path to the service account key
const serviceAccountPath = path.resolve(__dirname, '..', 'backend/payvost-firebase-adminsdk-d1yhq-da84137a2e.json');

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://payvost-default-rtdb.firebaseio.com"
  });
  console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK:", error);
}

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Payvost backend is running 🚀");
});

// Mount the user routes
app.use('/user', userRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
