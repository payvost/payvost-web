# PDF Service Migration - Complete

## ✅ What Was Implemented

Successfully migrated invoice PDF generation from Google Cloud Functions to your backend microservices architecture.

### 1. **New PDF Service** (`/backend/services/pdf`)
- Express server with Puppeteer for high-fidelity PDF generation
- Renders the actual invoice HTML page (pixel-perfect output)
- Health check endpoint
- Configurable via environment variables

### 2. **Gateway Integration** (`/backend/index.ts`)
- Added `/api/pdf/invoice/:id` proxy endpoint
- Added `/api/pdf/health` health check proxy
- Forwards requests from gateway to PDF service

### 3. **Frontend Updates** (`/src/app/invoice/[id]/page.tsx`)
- Updated to use backend API (`http://localhost:3001/api/pdf/invoice/:id`)
- Added `?pdf=1` parameter support for PDF rendering mode
- Enhanced print/PDF CSS styling (same layout for both)
- Improved error handling with user-friendly messages

### 4. **Configuration**
- Updated `.env` with PDF service variables
- Updated root `package.json` with `dev:pdf` script
- Main `dev` script now runs all three services concurrently

## 🚀 How to Use

### Start All Services
```bash
npm run dev
```

This starts:
- **Frontend** (Next.js) on `http://localhost:3000`
- **Backend Gateway** on `http://localhost:3001`
- **PDF Service** on `http://localhost:3005`

### Start Individual Services
```bash
# Frontend only
npm run dev:client

# Backend gateway only
npm run dev:server

# PDF service only
npm run dev:pdf
```

## 🧪 Testing

### 1. Test PDF Service Directly
```bash
# Health check
curl http://localhost:3005/health

# Generate PDF for an invoice
curl -o test-invoice.pdf http://localhost:3005/invoice/53huuX4DMt6frVEztLHH
```

### 2. Test Through Gateway
```bash
# Health check
curl http://localhost:3001/api/pdf/health

# Generate PDF
curl -o test-invoice.pdf http://localhost:3001/api/pdf/invoice/53huuX4DMt6frVEztLHH
```

### 3. Test in Browser
1. Start all services: `npm run dev`
2. Open invoice page: `http://localhost:3000/invoice/53huuX4DMt6frVEztLHH`
3. Click "Download PDF" button
4. PDF should download successfully

### 4. Test Print Mode
Open in browser with print flag:
```
http://localhost:3000/invoice/53huuX4DMt6frVEztLHH?print=1
```

## 📁 File Structure

```
backend/services/pdf/
├── src/
│   └── index.ts          # PDF service implementation
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .gitignore           # Ignore node_modules, dist, etc.
└── README.md            # Service documentation
```

## 🔧 Environment Variables

Added to `.env`:
```env
# PDF Service Configuration
PDF_SERVICE_PORT=3005
PDF_SERVICE_URL=http://localhost:3005
PUBLIC_ORIGIN=http://localhost:3000

# Frontend API URL (updated to use local backend)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🎯 Benefits of This Approach

### ✅ Zero Google Cloud Dependency
- No more billing issues
- No Cloud Functions required
- No Firebase Functions needed

### ✅ Fits Your Architecture
- Consistent with `/backend/services/*` structure
- Uses same gateway pattern
- Easy to maintain and debug

### ✅ High Quality PDFs
- Uses actual HTML/CSS from invoice page
- Pixel-perfect rendering (same as browser)
- Print and download use identical styling

### ✅ Easy Deployment
Can be deployed to:
- **Railway** - `railway up`
- **Render.com** - Add to render.yaml
- **Fly.io** - `flyctl launch`
- **VPS** - Docker or PM2
- **Any Node.js host**

### ✅ Development Experience
- Hot reload with `tsx watch`
- Runs alongside other services
- Easy to test locally
- Clear separation of concerns

## 🚢 Deployment Options

### Option 1: Deploy All Services Together
Deploy the entire backend as a monolith (including PDF service):
```bash
# Build all
npm run build

# Deploy to your hosting provider
# (Railway, Render, VPS, etc.)
```

### Option 2: Deploy PDF Service Separately
Deploy PDF service independently for better scaling:

**Railway:**
```bash
cd backend/services/pdf
railway init
railway up
```

**Render.com (render.yaml):**
```yaml
services:
  - type: web
    name: payvost-pdf
    env: node
    buildCommand: cd backend/services/pdf && npm install && npm run build
    startCommand: cd backend/services/pdf && npm start
    envVars:
      - key: PDF_SERVICE_PORT
        value: 3005
      - key: PUBLIC_ORIGIN
        value: https://payvost.com
```

**Docker:**
```dockerfile
FROM node:20-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/services/pdf/package*.json ./
RUN npm ci --only=production
COPY backend/services/pdf .
RUN npm run build

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
EXPOSE 3005
CMD ["npm", "start"]
```

### Option 3: Keep Using Cloud Run (Just Not Firebase Functions)
Deploy PDF service to Cloud Run directly:
```bash
cd backend/services/pdf
gcloud run deploy pdf-service \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 120
```

## 🔄 Migration from Cloud Functions

### What to Remove (Optional)
Since you're moving away from Cloud Functions:

1. **Stop using Firebase Functions:**
   - `/functions/src/index.ts` - PDF download endpoint (no longer needed)
   - Can keep other Firebase Functions if they serve other purposes

2. **Update environment variables in production:**
   - `NEXT_PUBLIC_API_URL` → Point to your backend (not Cloud Run)
   - `PDF_SERVICE_URL` → Point to your PDF service

3. **Remove Cloud Functions deployment:**
   ```bash
   firebase functions:delete api2 --region us-central1
   ```

## 🐛 Troubleshooting

### PDF Service Won't Start
**Error:** `Cannot find module 'puppeteer'`
```bash
cd backend/services/pdf
npm install
```

### Browser Launch Failed
**Error:** `Failed to launch the browser process`

Install Chromium dependencies (Linux):
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

Set executable path:
```bash
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### PDF Generation Timeout
Increase timeout in `backend/services/pdf/src/index.ts`:
```typescript
await page.goto(url, {
  waitUntil: 'networkidle0',
  timeout: 120000, // 2 minutes
});
```

### CORS Errors
Ensure CORS is configured in gateway:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
```

## 📊 Performance

Expected performance:
- **Cold start:** ~2-3 seconds (browser initialization)
- **Warm requests:** ~500ms-1s per PDF
- **Memory usage:** ~512MB-1GB (Puppeteer + Chrome)
- **Concurrent requests:** Browser is reused, so multiple PDFs can be generated simultaneously

## 🎉 Next Steps

1. ✅ Test locally with `npm run dev`
2. ✅ Verify invoice downloads work
3. ✅ Test print functionality
4. 🔲 Deploy to your preferred hosting
5. 🔲 Update production environment variables
6. 🔲 Monitor performance and errors
7. 🔲 (Optional) Remove old Cloud Functions

## 📝 Notes

- Browser instance is kept alive between requests for better performance
- Graceful shutdown ensures browser closes properly
- All environment variables are in `.env` for easy configuration
- Service logs include timing information for debugging
- Frontend has fallback error messages if PDF service is down

---

**Migration complete!** Your invoice PDF generation is now running entirely on your own infrastructure with zero Google Cloud dependency.
