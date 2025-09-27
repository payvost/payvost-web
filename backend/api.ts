
import serverless from 'serverless-http';
import express from 'express';
import admin from 'firebase-admin';
try {
  if (admin.apps.length === 0) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),


const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

app.get("/api", (_req, res) => {
  res.send("Payvost backend is running 🚀");
});

// Mount the user routes
app.use('/api/user', userRoutes);

export const handler = serverless(app);
