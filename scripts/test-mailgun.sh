#!/bin/bash
# Mailgun Test Script
# Usage: ./test-mailgun.sh <email> [firebase_token]

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
FIREBASE_TOKEN="${2:-}"
TEST_EMAIL="${1:-}"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Validate inputs
if [ -z "$TEST_EMAIL" ]; then
    print_error "Email address required"
    echo ""
    echo "Usage: $0 <email> [firebase_token]"
    echo ""
    echo "Examples:"
    echo "  $0 test@example.com                    # Uses default token"
    echo "  $0 test@example.com YOUR_FIREBASE_TOKEN # Uses provided token"
    echo ""
    echo "Environment Variables:"
    echo "  API_URL - Backend API URL (default: http://localhost:3001)"
    echo "  FIREBASE_TOKEN - Firebase authentication token"
    exit 1
fi

# Validate email format
if ! [[ "$TEST_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    print_error "Invalid email format: $TEST_EMAIL"
    exit 1
fi

print_info "Testing Mailgun Configuration"
echo "================================"
echo ""
echo "API URL: $API_URL"
echo "Test Email: $TEST_EMAIL"
echo "Firebase Token: ${FIREBASE_TOKEN:0:20}..." # Show first 20 chars
echo ""

# Check if API is reachable
print_info "Checking API connectivity..."
if ! curl -s -f "$API_URL/health" > /dev/null 2>&1; then
    print_error "Cannot reach API at $API_URL"
    echo "Make sure the backend is running."
    exit 1
fi
print_success "API is reachable"
echo ""

# Prepare headers
HEADERS=(
    "Content-Type: application/json"
)

if [ -n "$FIREBASE_TOKEN" ]; then
    HEADERS+=("Authorization: Bearer $FIREBASE_TOKEN")
fi

# Make the test request
print_info "Sending test email to $TEST_EMAIL..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_URL}/api/test/mailgun?email=$(urlencode "$TEST_EMAIL")" \
    "${HEADERS[@]/#/-H }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Parse response
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Test email sent successfully!"
    echo ""
    echo "Response:"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    echo ""
    print_info "Check your email inbox (may take a few seconds)"
    exit 0
elif [ "$HTTP_CODE" = "400" ]; then
    print_error "Bad request (400)"
    echo "Response:"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    exit 1
elif [ "$HTTP_CODE" = "401" ]; then
    print_error "Unauthorized (401) - Invalid or missing Firebase token"
    echo ""
    echo "Make sure to provide a valid Firebase token:"
    echo "  $0 $TEST_EMAIL YOUR_FIREBASE_TOKEN"
    exit 1
elif [ "$HTTP_CODE" = "500" ]; then
    print_error "Server error (500) - Mailgun may not be configured"
    echo ""
    echo "Response:"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    echo ""
    print_info "Check that these environment variables are set:"
    echo "  - MAILGUN_API_KEY"
    echo "  - MAILGUN_DOMAIN"
    echo "  - MAILGUN_FROM_EMAIL"
    exit 1
else
    print_error "Unexpected response (HTTP $HTTP_CODE)"
    echo "Response:"
    echo "$BODY"
    exit 1
fi

# Helper function to URL encode
urlencode() {
    python3 -c "import urllib.parse; print(urllib.parse.quote('$1'))"
}
