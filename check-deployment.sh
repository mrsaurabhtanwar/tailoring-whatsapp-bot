#!/bin/bash

# Deployment verification script for Render
echo "🔍 Checking deployment status..."

# Function to check endpoint
check_endpoint() {
    local url=$1
    local description=$2
    
    echo "Testing $description: $url"
    
    if curl -s -f "$url" > /dev/null; then
        echo "✅ $description - OK"
        return 0
    else
        echo "❌ $description - Failed"
        return 1
    fi
}

# Check if URL is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <your-render-app-url>"
    echo "Example: $0 https://tailoring-whatsapp-bot.onrender.com"
    exit 1
fi

BASE_URL=$1

echo "🌐 Checking deployment at: $BASE_URL"
echo "----------------------------------------"

# Test main endpoints
check_endpoint "$BASE_URL/" "Health Check"
check_endpoint "$BASE_URL/healthz" "Strict Health Check"
check_endpoint "$BASE_URL/session-status" "Session Status"

# Check if QR endpoint is accessible (may return 404 if no QR)
echo "Testing QR Code endpoint: $BASE_URL/qr"
QR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/qr")
if [ "$QR_STATUS" = "200" ] || [ "$QR_STATUS" = "404" ]; then
    echo "✅ QR Code Endpoint - OK (Status: $QR_STATUS)"
else
    echo "❌ QR Code Endpoint - Failed (Status: $QR_STATUS)"
fi

echo "----------------------------------------"
echo "🏁 Deployment check completed!"
echo ""
echo "📱 Next steps:"
echo "1. Visit $BASE_URL/scanner to scan QR code"
echo "2. Check session status at $BASE_URL/session-status"
echo "3. Test webhook at $BASE_URL/webhook/order-ready"
