import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";

// ✅ Import invoice functions
import { generateSignedInvoiceUrl } from "./invoice";

const app = express();
app.use(cors());

app.get("/", (_req, res) => {
  res.send("API is working via Firebase Functions 🚀");
});

// ✅ Export Express API
export const api = functions.https.onRequest(app);

// ✅ Export callable function for invoices
export { generateSignedInvoiceUrl };
