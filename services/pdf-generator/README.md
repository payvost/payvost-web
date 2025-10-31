# PDF Generator Microservice

Dedicated Cloud Run service for generating PDFs from web pages using Puppeteer and headless Chromium.

## Features

- Puppeteer-based PDF generation
- Chromium bundled in Docker container
- CORS-enabled for Firebase Functions integration
- Health check endpoint
- Graceful shutdown handling

## Local Development

```bash
npm install
npm start
```

Test locally:
```bash
curl "http://localhost:8080/pdf?url=https://www.payvost.com/invoice/YOUR_INVOICE_ID" --output test.pdf
```

## Deploy to Cloud Run

```bash
gcloud run deploy pdf-generator \
  --source . \
  --region us-central1 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --allow-unauthenticated \
  --platform managed \
  --project payvost
```

## Environment Variables

- `PORT` - Server port (default: 8080)
- `PUPPETEER_EXECUTABLE_PATH` - Path to Chromium binary (default: /usr/bin/chromium)

## API

### GET /health

Health check endpoint.

**Response:**
```
OK
```

### GET /pdf?url=<URL>

Generate a PDF from the given URL.

**Query Parameters:**
- `url` (required) - The URL to render as PDF

**Response:**
- Content-Type: application/pdf
- Binary PDF data

**Example:**
```bash
curl "https://pdf-generator-xxx.run.app/pdf?url=https://www.payvost.com/invoice/ABC123" --output invoice.pdf
```

## Security

- URL validation to prevent SSRF attacks
- Only allows payvost.com domains and localhost
- CORS enabled for cross-origin requests from Firebase Functions
