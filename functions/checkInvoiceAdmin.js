const admin = require('firebase-admin');
const path = require('path');

const invoiceId = process.argv[2];
if (!invoiceId) {
  console.error('Usage: node checkInvoiceAdmin.js <invoiceId>');
  process.exit(1);
}

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
try {
  const serviceAccount = require(keyPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (err) {
  console.error('Failed to initialize admin SDK. Did you add functions/serviceAccountKey.json? Error:', err.message);
  process.exit(1);
}

const db = admin.firestore();

(async () => {
  try {
    console.log('Checking businessInvoices/' + invoiceId);
    const doc = await db.collection('businessInvoices').doc(invoiceId).get();
    console.log('businessInvoices exists:', doc.exists);
    if (doc.exists) console.log('businessInvoices data:', JSON.stringify(doc.data(), null, 2));

    console.log('\nChecking invoices/' + invoiceId);
    const doc2 = await db.collection('invoices').doc(invoiceId).get();
    console.log('invoices exists:', doc2.exists);
    if (doc2.exists) console.log('invoices data:', JSON.stringify(doc2.data(), null, 2));
  } catch (err) {
    console.error('Error during check:', err);
  } finally {
    process.exit(0);
  }
})();
