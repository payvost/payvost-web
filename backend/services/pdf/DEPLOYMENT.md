# PDF Service Deployment Guide

## Overview
The PDF service is a standalone Express microservice that generates PDF invoices using Puppeteer (headless Chrome). It's been moved from Firebase Cloud Functions to your backend microservices architecture.

## Architecture

```
Frontend (Next.js) 
    ↓ 
Backend Gateway (port 3001)
    ↓ /api/pdf/* 
PDF Service (port 3005)
    ↓ Puppeteer
Invoice Page HTML → PDF
```

## Local Development

### 1. Install Dependencies
```bash
cd backend/services/pdf
npm install
```

### 2. Start the Service
```bash
# Option A: Start PDF service only
cd backend/services/pdf
npm run dev

# Option B: Start all services (recommended)
cd /workspaces/payvost-web
npm run dev  # Starts frontend (3000) + backend (3001) + PDF service (3005)
```

### 3. Test the Service
```bash
# Health check
curl http://localhost:3005/health

# Generate invoice PDF
curl http://localhost:3005/invoice/{invoiceId} > test.pdf
```

## Production Deployment

The PDF service can be deployed to any platform that supports Node.js and headless Chrome:

### Option 1: Railway (Recommended - Easiest)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and create project:
```bash
railway login
cd backend/services/pdf
railway init
```

3. Set environment variables in Railway dashboard:
```
PUBLIC_ORIGIN=https://payvost.com
PORT=3005
```

4. Deploy:
```bash
railway up
```

5. Get the service URL from Railway dashboard and update `.env`:
```
PDF_SERVICE_URL=https://your-app.railway.app
```

### Option 2: Render.com

1. Create `render.yaml` in `backend/services/pdf/`:
```yaml
services:
  - type: web
    name: payvost-pdf-service
    env: node
    region: oregon
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PUBLIC_ORIGIN
        value: https://payvost.com
      - key: PORT
        value: 3005
```

2. Connect repo to Render and deploy

3. Update `.env` with Render URL:
```
PDF_SERVICE_URL=https://payvost-pdf-service.onrender.com
```

### Option 3: Fly.io

1. Install Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Create `fly.toml`:
```toml
app = "payvost-pdf"
primary_region = "iad"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  PUBLIC_ORIGIN = "https://payvost.com"
  PORT = "3005"

[[services]]
  internal_port = 3005
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

3. Deploy:
```bash
fly launch
fly deploy
```

### Option 4: DigitalOcean/Linode/Hetzner VPS

1. SSH into server and install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. Install Chromium dependencies:
```bash
sudo apt-get install -y \
  chromium-browser \
  chromium-codecs-ffmpeg
```

3. Clone repo and install:
```bash
git clone https://github.com/payvost/payvost-web.git
cd payvost-web/backend/services/pdf
npm install
npm run build
```

4. Create systemd service (`/etc/systemd/system/payvost-pdf.service`):
```ini
[Unit]
Description=Payvost PDF Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/payvost-web/backend/services/pdf
Environment="NODE_ENV=production"
Environment="PUBLIC_ORIGIN=https://payvost.com"
Environment="PORT=3005"
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

5. Start service:
```bash
sudo systemctl enable payvost-pdf
sudo systemctl start payvost-pdf
```

6. Configure Nginx reverse proxy:
```nginx
server {
    listen 80;
    server_name pdf.payvost.com;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}
```

## Environment Variables

### Required
- `PUBLIC_ORIGIN`: Your frontend URL (e.g., `https://payvost.com`)
- `PORT`: Service port (default: 3005)

### Optional
- `NODE_ENV`: `development` or `production`

## Backend Gateway Configuration

Once deployed, update your backend gateway to proxy PDF requests:

1. Set `PDF_SERVICE_URL` in backend `.env`:
```
PDF_SERVICE_URL=https://your-pdf-service-url.com
```

2. The gateway will automatically proxy `/api/pdf/*` requests to the PDF service

3. Frontend will call: `https://api.payvost.com/api/pdf/invoice/{id}`

## Monitoring & Troubleshooting

### Check Service Health
```bash
curl https://your-pdf-service-url.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-11-02T..."}
```

### Common Issues

#### 1. Chromium not found
**Error**: `Failed to launch the browser process`

**Solution**: Install Chromium dependencies
```bash
# Railway/Render - add to package.json
"engines": {
  "node": "20.x"
},
"buildpacks": [{
  "url": "heroku/nodejs"
}, {
  "url": "https://github.com/jontewks/puppeteer-heroku-buildpack"
}]

# VPS - install manually
sudo apt-get install chromium-browser
```

#### 2. Memory issues
**Error**: Browser crashes or OOM errors

**Solution**: Increase memory allocation
- Railway: Upgrade plan or set `--max-old-space-size=2048`
- Render: Use at least "Starter" plan (512MB)
- VPS: Add swap space

#### 3. Timeout errors
**Error**: PDF generation times out

**Solution**: 
- Increase timeout in gateway proxy (default 60s)
- Optimize invoice page (reduce images, external fonts)
- Add `waitUntil: 'networkidle0'` to Puppeteer

### Logs

```bash
# Railway
railway logs

# Render
# Check dashboard logs

# VPS
sudo journalctl -u payvost-pdf -f
```

## Scaling Considerations

### For High Traffic
- Use a dedicated service (not serverless) to avoid cold starts
- Add Redis caching for frequently accessed invoices
- Consider pre-generating PDFs on invoice creation
- Use a CDN to serve cached PDFs from Cloud Storage

### Cost Optimization
- **Railway**: ~$5-10/month for starter
- **Render**: Free tier available (spins down after inactivity)
- **Fly.io**: Free tier: 3 VMs with 256MB RAM
- **VPS**: $5-10/month (DigitalOcean, Hetzner)

## Alternative: Keep on Vercel (Serverless)

If you want to keep using Vercel serverless for PDF generation:

1. Create `/pages/api/pdf/invoice/[id].ts`:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  
  try {
    const page = await browser.newPage();
    await page.goto(`${process.env.NEXT_PUBLIC_SITE_URL}/invoice/${id}?pdf=1`, {
      waitUntil: 'networkidle0',
    });
    
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.send(pdf);
  } finally {
    await browser.close();
  }
}

export const config = {
  maxDuration: 60, // Pro plan required
};
```

2. Install dependencies:
```bash
npm install @sparticuz/chromium puppeteer-core
```

**Note**: This requires Vercel Pro plan ($20/month) for 60s timeout.

## Migration from Cloud Functions

The new setup eliminates:
- ✅ Firebase Cloud Functions billing dependency
- ✅ Cold start issues (dedicated service stays warm)
- ✅ Google Cloud vendor lock-in
- ✅ Complex GCP billing setup

Your invoices now work independently of Firebase!
