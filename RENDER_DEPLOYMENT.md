# Render PDF Service Deployment

## Service URL
**Live URL:** https://payvost-pdf-generator.onrender.com

## Service Configuration

### Environment Variables
- `NODE_ENV=production` (set automatically by Render)
- `PORT=10000` (set automatically by Render)
- `FIREBASE_SERVICE_ACCOUNT_KEY` (optional - if service needs direct Firestore access)

### Endpoints

#### Health Check
```
GET /health
```
Returns: `OK`

#### Generate PDF
```
GET /pdf?invoiceId={invoiceId}
```
Returns: PDF file (application/pdf)

### Testing

1. **Health Check:**
   ```bash
   curl https://payvost-pdf-generator.onrender.com/health
   ```

2. **Generate PDF:**
   ```bash
   curl "https://payvost-pdf-generator.onrender.com/pdf?invoiceId=YOUR_INVOICE_ID" --output test.pdf
   ```

## Vercel Integration

### Environment Variable
Add to Vercel Dashboard → Settings → Environment Variables:

```
PDF_SERVICE_URL=https://payvost-pdf-generator.onrender.com
```

### How It Works

1. **Invoice Created** → Saved to Firestore
2. **Vercel Function** → Calls Render PDF service (async)
3. **Render Service** → Generates PDF using React-PDF
4. **Vercel Function** → Uploads PDF to Firebase Storage
5. **Firestore** → Saves signed URL

## Benefits

✅ **Offloads CPU** - PDF generation happens on Render, not Vercel
✅ **No timeout issues** - Render handles longer operations
✅ **Cost-effective** - Free tier available, $7/month for always-on
✅ **Scalable** - Render auto-scales based on demand

## Monitoring

### Render Dashboard
- View logs: https://dashboard.render.com
- Check service status
- Monitor resource usage

### Service Logs
- Build logs: Shows deployment status
- Runtime logs: Shows PDF generation requests
- Error logs: Shows any failures

## Troubleshooting

### Service Sleeps (Free Tier)
- First request may take 30s (cold start)
- Subsequent requests are fast
- Upgrade to Starter ($7/month) to avoid cold starts

### PDF Generation Fails
1. Check Render logs for errors
2. Verify invoice exists and is public
3. Check Firebase service account key (if using direct Firestore access)
4. Verify service is running (health check)

### Timeout Errors
- Render free tier has timeout limits
- Upgrade to Starter plan for longer timeouts
- Or optimize PDF generation for faster processing

## Next Steps

1. ✅ Service deployed on Render
2. ✅ Vercel updated to use Render service
3. ⏳ Add `PDF_SERVICE_URL` to Vercel environment variables
4. ⏳ Test PDF generation end-to-end
5. ⏳ Monitor performance and optimize if needed

