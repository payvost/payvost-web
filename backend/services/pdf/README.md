# PDF Generation Service

Generates PDFs for invoices and other documents using Puppeteer (headless Chrome).

## Features

- Invoice PDF generation from public invoice pages
- High-fidelity rendering (matches web exactly)
- Configurable page size and margins
- Health check endpoint

## Endpoints

### `GET /health`
Health check endpoint.

**Response:** `200 OK`

### `GET /invoice/:id`
Generate and download PDF for a specific invoice.

**Parameters:**
- `id` - Invoice ID

**Query Parameters:**
- `origin` (optional) - Override the public site origin (default: from env or localhost:3000)

**Response:** PDF file with `Content-Type: application/pdf`

**Example:**
```
GET http://localhost:3005/invoice/53huuX4DMt6frVEztLHH
```

## Environment Variables

```env
# Port for the PDF service
PDF_SERVICE_PORT=3005

# Public site origin (for rendering invoice pages)
PUBLIC_ORIGIN=http://localhost:3000

# Node environment
NODE_ENV=development
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Architecture

1. Receives PDF generation request with invoice ID
2. Launches headless Chrome via Puppeteer
3. Navigates to the public invoice page with `?pdf=1` parameter
4. Waits for page to fully load (networkidle0)
5. Applies print media emulation
6. Generates PDF with A4 format and specified margins
7. Returns PDF as response

## Dependencies

- **express** - Web server framework
- **puppeteer** - Headless Chrome automation
- **cors** - CORS middleware

## Deployment

Can be deployed to:
- Railway
- Render.com
- Fly.io
- VPS (Docker)
- Any Node.js hosting platform

### Docker Example

```dockerfile
FROM node:20-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3005
CMD ["npm", "start"]
```

## Notes

- Memory requirements: ~512MB-1GB (Puppeteer + Chrome)
- Cold start: ~2-3 seconds on first request
- Warm requests: ~500ms-1s per PDF generation
