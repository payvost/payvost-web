import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.get('/', (_req, res) => {
  res.send('API is working via Firebase Functions 🚀');
});

// If needed, import backend logic like this:
// import { userRouter } from '../backend/services/user';
// app.use('/user', userRouter);

export const api = functions.https.onRequest(app);
