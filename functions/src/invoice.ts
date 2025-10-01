// src/invoice.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Storage } from "@google-cloud/storage";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = new Storage();

export const generateSignedInvoiceUrl = functions.https.onCall(async (data, context) => {
  // ✅ Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to generate invoice URLs."
    );
  }

  const { userId, invoiceId } = data;

  // ✅ Ensure the user can only request their own invoices
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You can only generate URLs for your own invoices."
    );
  }

  try {
    const bucket = storage.bucket(`${process.env.GCLOUD_PROJECT}.appspot.com`);
    const filePath = `invoices/${userId}/${invoiceId}.pdf`;
    const file = bucket.file(filePath);

    // Generate signed URL (expires in 7 days)
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    // Save link in Firestore
    await db
      .collection("users")
      .doc(userId)
      .collection("invoices")
      .doc(invoiceId)
      .update({
        shareUrl: url,
        shareUrlExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

    return { shareUrl: url };
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new functions.https.HttpsError("internal", "Failed to generate signed URL");
  }
});
