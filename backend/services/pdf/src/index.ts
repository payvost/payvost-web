import express, { Request, Response } from 'express';
import puppeteer, { Browser } from 'puppeteer';
import cors from 'cors';
import { Storage } from '@google-cloud/storage';

const app = express();
const PORT = process.env.PDF_SERVICE_PORT || 3005;
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';
const PDF_BUCKET = process.env.PDF_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '';

// Middleware
app.use(cors());
app.use(express.json());

// Reusable browser instance (keep alive for better performance)
let browserInstance: Browser | null = null;

// Google Cloud Storage client (used for caching PDFs)
const storage = new Storage();

function getBucket() {
  if (!PDF_BUCKET) {
    throw new Error('PDF_BUCKET (or FIREBASE_STORAGE_BUCKET) env var not set');
  }
  return storage.bucket(PDF_BUCKET);
}

function pdfObjectPath(id: string) {
  return `invoices/${id}.pdf`;
}

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  console.log('[PDF Service] Launching new browser instance...');
  browserInstance = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080',
    ],
    ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    }),
  });

  console.log('[PDF Service] Browser launched successfully');
  return browserInstance;
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'pdf-generation',
    timestamp: new Date().toISOString(),
    browserConnected: browserInstance?.isConnected() || false,
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Payvost PDF Generation Service',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      invoice: 'GET /invoice/:id',
    },
  });
});

// Invoice PDF generation endpoint
app.get('/invoice/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const origin = req.query.origin as string || PUBLIC_ORIGIN;

  if (!id) {
    return res.status(400).json({ error: 'Missing invoice ID' });
  }

  const bucket = getBucket();
  const objectPath = pdfObjectPath(id);
  const file = bucket.file(objectPath);

  // 1) Serve cached version if it exists
  try {
    const [exists] = await file.exists();
    if (exists) {
      console.log(`[PDF Service] Cache hit for invoice ${id} → gs://${PDF_BUCKET}/${objectPath}`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
      // Let client/proxies cache for 1 day; bucket object may have longer cache-control
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return file.createReadStream().on('error', (err) => {
        console.error('[PDF Service] Error streaming cached PDF:', err);
        if (!res.headersSent) res.status(500).end('Error streaming cached PDF');
      }).pipe(res);
    }
  } catch (e) {
    console.warn('[PDF Service] Cache check failed, falling back to render:', (e as any)?.message || e);
  }

  console.log(`[PDF Service] Cache miss → generating PDF for invoice: ${id}`);

  let browser: Browser | null = null;
  const startTime = Date.now();

  try {
    // Get browser instance
    browser = await getBrowser();
    
    // Create new page
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to invoice page with pdf=1 flag
    const url = `${origin}/invoice/${id}?pdf=1`;
    console.log(`[PDF Service] Navigating to: ${url}`);

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    // Emulate print media for @media print styles
    await page.emulateMediaType('print');

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '16mm',
        right: '16mm',
        bottom: '16mm',
        left: '16mm',
      },
    });

    // Close the page (but keep browser alive)
    await page.close();

    // Save to Cloud Storage for caching
    try {
      await file.save(pdf, {
        resumable: false,
        contentType: 'application/pdf',
        metadata: { cacheControl: 'public, max-age=31536000' },
      });
      console.log(`[PDF Service] Cached PDF at gs://${PDF_BUCKET}/${objectPath}`);
    } catch (cacheErr) {
      console.error('[PDF Service] Failed to cache PDF:', (cacheErr as any)?.message || cacheErr);
    }

    const duration = Date.now() - startTime;
    console.log(`[PDF Service] PDF generated successfully in ${duration}ms`);

    // Send PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.setHeader('Content-Length', pdf.length.toString());
    res.status(200).send(pdf);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[PDF Service] Error generating PDF (${duration}ms):`, error.message);
    console.error(error.stack);

    // Close browser on error to force fresh instance next time
    if (browserInstance) {
      try {
        await browserInstance.close();
      } catch (e) {
        // Ignore close errors
      }
      browserInstance = null;
    }

    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message,
      details: NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Warm cache endpoint: generate and store PDF without returning file
app.post('/cache/invoice/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const origin = req.query.origin as string || PUBLIC_ORIGIN;

  if (!id) return res.status(400).json({ error: 'Missing invoice ID' });

  const bucket = getBucket();
  const objectPath = pdfObjectPath(id);
  const file = bucket.file(objectPath);

  // If already cached, return 200 quickly
  try {
    const [exists] = await file.exists();
    if (exists) {
      return res.status(200).json({ status: 'cached', path: objectPath });
    }
  } catch {}

  let browser: Browser | null = null;
  const startTime = Date.now();
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    const url = `${origin}/invoice/${id}?pdf=1`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.emulateMediaType('print');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '16mm', right: '16mm', bottom: '16mm', left: '16mm' },
    });
    await page.close();
    await file.save(pdf, {
      resumable: false,
      contentType: 'application/pdf',
      metadata: { cacheControl: 'public, max-age=31536000' },
    });
    const duration = Date.now() - startTime;
    console.log(`[PDF Service] Warmed cache for invoice ${id} in ${duration}ms`);
    return res.status(201).json({ status: 'generated', path: objectPath });
  } catch (error: any) {
    console.error('[PDF Service] Warm cache error:', error.message);
    return res.status(500).json({ error: 'Failed to warm cache', message: error.message });
  }
});

// Graceful shutdown
const shutdown = async () => {
  console.log('[PDF Service] Shutting down gracefully...');
  
  if (browserInstance) {
    try {
      await browserInstance.close();
      console.log('[PDF Service] Browser closed');
    } catch (error) {
      console.error('[PDF Service] Error closing browser:', error);
    }
  }
  
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(PORT, () => {
  console.log(`[PDF Service] Running on port ${PORT}`);
  console.log(`[PDF Service] Public origin: ${PUBLIC_ORIGIN}`);
  console.log(`[PDF Service] Environment: ${NODE_ENV}`);
  console.log(`[PDF Service] Endpoints:`);
  console.log(`  - GET http://localhost:${PORT}/health`);
  console.log(`  - GET http://localhost:${PORT}/invoice/:id`);
});
