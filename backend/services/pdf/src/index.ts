import express, { Request, Response } from 'express';
import puppeteer, { Browser } from 'puppeteer';
import cors from 'cors';

const app = express();
const PORT = process.env.PDF_SERVICE_PORT || 3005;
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());

// Reusable browser instance (keep alive for better performance)
let browserInstance: Browser | null = null;

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

  console.log(`[PDF Service] Generating PDF for invoice: ${id}`);

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
