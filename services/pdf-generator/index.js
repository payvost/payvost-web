const express = require('express');
const React = require('react');
const { renderToStream } = require('@react-pdf/renderer');
const cors = require('cors');
const fetch = require('node-fetch');
const InvoiceDocument = require('./InvoiceDocument');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

async function fetchInvoiceData(invoiceId) {
  const publicEndpoints = [
    `https://us-central1-payvost.cloudfunctions.net/api2/public/invoice/${invoiceId}`,
    `https://api2-jpcbatlqpa-uc.a.run.app/public/invoice/${invoiceId}`,
  ];

  for (const endpoint of publicEndpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        console.log(`[PDF] Fetched invoice from: ${endpoint}`);
        return data;
      }
    } catch (error) {
      console.log(`[PDF] Failed to fetch from ${endpoint}:`, error.message);
      continue;
    }
  }

  throw new Error(`Invoice ${invoiceId} not found or not public`);
}

app.get('/pdf', async (req, res) => {
  // Backward compatibility: allow legacy `url` param by extracting the invoice id from it
  let { invoiceId } = req.query;
  const { url: legacyUrl } = req.query;

  if (!invoiceId && legacyUrl) {
    try {
      const parsed = new URL(String(legacyUrl));
      const match = parsed.pathname.match(/\/invoice\/([^/?#]+)/);
      if (match && match[1]) {
        invoiceId = match[1];
        console.log(`[PDF] Extracted invoiceId from legacy url param: ${invoiceId}`);
      }
    } catch (e) {
      // ignore URL parsing errors; we'll fall back to the normal validation below
    }
  }

  if (!invoiceId) {
    return res.status(400).json({ error: 'Missing invoiceId parameter' });
  }

  try {
    console.log(`[PDF] Generating PDF for invoice: ${invoiceId}`);
    
    const invoiceData = await fetchInvoiceData(invoiceId);
    const invoiceDoc = React.createElement(InvoiceDocument, { invoice: invoiceData });
    const stream = await renderToStream(invoiceDoc);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    
    stream.pipe(res);
    stream.on('end', () => console.log(`[PDF] Successfully generated PDF for ${invoiceId}`));
    
  } catch (error) {
    console.error('[PDF] Generation failed:', error.message);
    console.error(error.stack);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`PDF Generator service (React-PDF) listening on port ${PORT}`);
  console.log(`  GET /health - Health check`);
  console.log(`  GET /pdf?invoiceId=<id> - Generate PDF`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  process.exit(0);
});
