#!/bin/bash

echo "Testing OpenExchangeRates Integration"
echo "======================================"
echo ""

BASE_URL="http://localhost:3000"

# Test 1: Get latest rates
echo "Test 1: Get Latest Rates (USD base)"
echo "------------------------------------"
curl -s "${BASE_URL}/api/exchange-rates?base=USD&symbols=EUR,GBP,NGN" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2))" 2>/dev/null || echo "Failed or server not running"
echo ""
echo ""

# Test 2: Convert USD to NGN
echo "Test 2: Convert USD to NGN"
echo "--------------------------"
curl -s -X POST "${BASE_URL}/api/exchange-rates/convert" \
  -H "Content-Type: application/json" \
  -d '{"from":"USD","to":"NGN","amount":1000}' | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2))" 2>/dev/null || echo "Failed or server not running"
echo ""
echo ""

# Test 3: Convert EUR to GBP
echo "Test 3: Convert EUR to GBP"
echo "--------------------------"
curl -s -X POST "${BASE_URL}/api/exchange-rates/convert" \
  -H "Content-Type: application/json" \
  -d '{"from":"EUR","to":"GBP","amount":500}' | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2))" 2>/dev/null || echo "Failed or server not running"
echo ""
echo ""

# Test 4: Invalid currency
echo "Test 4: Invalid Currency (should fail gracefully)"
echo "------------------------------------------------"
curl -s -X POST "${BASE_URL}/api/exchange-rates/convert" \
  -H "Content-Type: application/json" \
  -d '{"from":"INVALID","to":"NGN","amount":100}' | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2))" 2>/dev/null || echo "Failed or server not running"
echo ""

echo "======================================"
echo "Testing Complete"
echo ""
echo "If you see JSON responses above, the API is working!"
echo "If you see 'Failed or server not running', start the dev server with: npm run dev"
