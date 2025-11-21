# PDF Generation & QR Code Testing Guide

## Test Checklist

### 1. QR Code Generation ✅
**Endpoint:** `/api/qr-code?url={url}`

**Test:**
```bash
# Test QR code generation
curl "http://localhost:3000/api/qr-code?url=https://payvost.com/invoice/test" --output test-qr.png
```

**Expected:**
- Returns PNG image
- QR code is scannable
- Links to the invoice URL

### 2. PDF Generation ✅
**Endpoint:** `/api/generate-invoice-pdf` (POST)

**Test Flow:**
1. Create a new invoice with status "Pending"
2. Check Vercel logs for PDF generation
3. Wait 5-10 seconds
4. Check Firestore for `pdfUrl` field
5. Check Firebase Storage for PDF file

**Expected:**
- Render service generates PDF
- PDF uploaded to Firebase Storage
- `pdfUrl` saved in Firestore

### 3. PDF Download ✅
**Endpoint:** `/api/pdf/invoice/[id]`

**Test:**
- Click "Download PDF" button
- Should redirect to signed URL from Storage

**Expected:**
- PDF downloads instantly (pre-generated)
- PDF is valid and opens correctly

### 4. PDF Print ✅
**Test:**
- Click "Print" button
- Should open PDF in new window

**Expected:**
- PDF opens in new browser tab
- Can be printed using browser's print dialog

### 5. QR Code Dialog ✅
**Test:**
- Click QR code button in send invoice dialog
- QR code dialog should open
- QR code should display

**Expected:**
- QR code displays correctly
- QR code is scannable
- Links to invoice URL

## Manual Testing Steps

1. **Start Dev Server:**
   ```bash
   npm run dev:client
   ```

2. **Create Invoice:**
   - Go to invoice creation page
   - Fill in invoice details
   - Set status to "Pending"
   - Click "Send Invoice"

3. **Test Send Invoice Dialog:**
   - Dialog should open
   - Check all buttons work:
     - ✅ Copy Link
     - ✅ Share
     - ✅ QR Code
     - ✅ Download PDF
     - ✅ Print

4. **Test QR Code:**
   - Click QR code button
   - QR code dialog opens
   - QR code displays
   - Download QR code
   - Scan QR code with phone

5. **Test PDF:**
   - Click Download PDF
   - PDF should download
   - Open PDF - should be valid
   - Click Print
   - PDF should open in new window

## API Endpoint Tests

### QR Code API
```bash
# Test QR code generation
curl "http://localhost:3000/api/qr-code?url=https://payvost.com/invoice/test123" --output qr-test.png
```

### PDF Generation API
```bash
# Test PDF generation (replace with real invoice ID)
curl -X POST http://localhost:3000/api/generate-invoice-pdf \
  -H "Content-Type: application/json" \
  -d '{"invoiceId":"YOUR_INVOICE_ID"}' \
  --output test-pdf-response.json
```

### PDF Download API
```bash
# Test PDF download (replace with real invoice ID)
curl "http://localhost:3000/api/pdf/invoice/YOUR_INVOICE_ID" --output test-invoice.pdf
```

## Expected Results

✅ **QR Code:**
- Generates instantly
- Valid PNG image
- Scannable with phone camera

✅ **PDF Generation:**
- Calls Render service
- PDF generated successfully
- Uploaded to Firebase Storage
- URL saved in Firestore

✅ **PDF Download:**
- Returns signed URL from Storage
- PDF downloads instantly
- PDF is valid and opens correctly

✅ **PDF Print:**
- Opens PDF in new window
- Can be printed from browser

## Troubleshooting

### QR Code doesn't generate?
- Check if dev server is running
- Check browser console for errors
- Verify `/api/qr-code` endpoint is accessible

### PDF generation fails?
- Check Render service is running
- Check `PDF_SERVICE_URL` is set in Vercel
- Check Vercel logs for errors

### PDF download fails?
- Check if PDF was generated
- Check Firestore for `pdfUrl` field
- Check Firebase Storage for PDF file
- Verify invoice is public

