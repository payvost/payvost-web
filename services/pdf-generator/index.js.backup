const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for Firebase Functions
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// PDF generation endpoint
app.get('/pdf', async (req, res) => {
  let url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Add print=1 query param for print-friendly styling
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.set('print', '1');
  url = parsedUrl.toString();

  // Validate URL to prevent SSRF
  try {
    const allowedHosts = ['payvost.com', 'www.payvost.com', 'localhost'];
    
    if (!allowedHosts.some(host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`))) {
      return res.status(403).json({ error: 'URL not allowed' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  let browser;
  try {
    console.log(`[PDF] Generating PDF for: ${url}`);
    
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      headless: true,
    });

    const page = await browser.newPage();
    
    // Set a realistic viewport and user agent
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to the URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for any client-side rendering to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      preferCSSPageSize: false
    });

    console.log(`[PDF] Successfully generated PDF (${pdf.length} bytes)`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
    
  } catch (error) {
    console.error('[PDF] Generation failed:', error.message);
    console.error(error.stack);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  } finally {
    if (browser) {
      await browser.close().catch(err => console.error('[PDF] Browser close error:', err));
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`PDF Generator service listening on port ${PORT}`);
  console.log(`Chromium path: ${process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
