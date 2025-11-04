#!/bin/bash
# Test Invoice PDF Generation
# This script tests both the Next.js API route and the dedicated PDF service

echo "====================================="
echo "  Invoice PDF Generation Tests"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health check for PDF service
echo "Test 1: PDF Service Health Check"
echo "-------------------------------------"
HEALTH=$(curl -s http://localhost:3005/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} PDF Service is running"
    echo "$HEALTH" | jq .
else
    echo -e "${RED}✗${NC} PDF Service is not responding"
fi
echo ""

# Test 2: Test PDF Service endpoint (Puppeteer-based)
echo "Test 2: PDF Service Invoice Generation (port 3005)"
echo "-------------------------------------"
curl -s -w "HTTP Status: %{http_code}\nSize: %{size_download} bytes\n" \
    "http://localhost:3005/invoice/test-invoice-123" \
    -o /tmp/invoice-puppeteer.pdf 2>&1

if [ -f /tmp/invoice-puppeteer.pdf ]; then
    FILE_TYPE=$(file -b /tmp/invoice-puppeteer.pdf)
    SIZE=$(ls -lh /tmp/invoice-puppeteer.pdf | awk '{print $5}')
    
    if [[ "$FILE_TYPE" == *"PDF"* ]]; then
        echo -e "${GREEN}✓${NC} PDF generated successfully!"
        echo "  File: /tmp/invoice-puppeteer.pdf"
        echo "  Size: $SIZE"
        echo "  Type: $FILE_TYPE"
    else
        echo -e "${RED}✗${NC} File is not a PDF"
        echo "  Type: $FILE_TYPE"
        echo "  Content preview:"
        head -c 200 /tmp/invoice-puppeteer.pdf
    fi
else
    echo -e "${RED}✗${NC} PDF file not created"
fi
echo ""

# Test 3: Test Next.js API Route (React-PDF)
echo "Test 3: Next.js API Invoice Generation (port 3000)"
echo "-------------------------------------"
curl -s -w "HTTP Status: %{http_code}\nSize: %{size_download} bytes\n" \
    "http://localhost:3000/api/pdf/invoice/test-invoice-123" \
    -o /tmp/invoice-nextjs.pdf 2>&1

if [ -f /tmp/invoice-nextjs.pdf ]; then
    FILE_TYPE=$(file -b /tmp/invoice-nextjs.pdf)
    SIZE=$(ls -lh /tmp/invoice-nextjs.pdf | awk '{print $5}')
    
    if [[ "$FILE_TYPE" == *"PDF"* ]]; then
        echo -e "${GREEN}✓${NC} PDF generated successfully!"
        echo "  File: /tmp/invoice-nextjs.pdf"
        echo "  Size: $SIZE"
        echo "  Type: $FILE_TYPE"
    else
        echo -e "${RED}✗${NC} File is not a PDF"
        echo "  Type: $FILE_TYPE"
        echo "  Content preview:"
        head -c 200 /tmp/invoice-nextjs.pdf
    fi
else
    echo -e "${RED}✗${NC} PDF file not created"
fi
echo ""

# Summary
echo "====================================="
echo "  Test Summary"
echo "====================================="
echo ""
echo "Generated files:"
ls -lh /tmp/invoice-*.pdf 2>/dev/null || echo "No PDF files generated"
echo ""
echo "To view a PDF, download it from /tmp/ or use:"
echo "  file /tmp/invoice-puppeteer.pdf"
echo "  file /tmp/invoice-nextjs.pdf"
