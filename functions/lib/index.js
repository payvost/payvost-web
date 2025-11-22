const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://payvost-web-default-rtdb.firebaseio.com"
});

const app = express();
app.use(cors());

// Basic route
app.get('/', (_req, res) => {
  res.send('API is working via Firebase Functions 🚀');
});

// Add more backend services if needed
// const userRouter = require('../backend/services/user');
// app.use('/user', userRouter);

exports.api = functions.https.onRequest(app);

// Optional standalone endpoint
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from Firebase Functions!");
});
