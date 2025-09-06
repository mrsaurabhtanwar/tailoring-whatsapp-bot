#!/bin/bash

# Render startup script for WhatsApp Bot
echo "🚀 Starting WhatsApp Bot deployment..."

# Check if we're on Render
if [ "$RENDER" = "true" ]; then
    echo "📦 Running on Render platform"
    
    # Set Chrome path for Render
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
    
    # Check if Chrome is available
    if command -v google-chrome-stable &> /dev/null; then
        echo "✅ Chrome found at: $(which google-chrome-stable)"
    else
        echo "⚠️ Chrome not found, Puppeteer will download it"
    fi
    
    # Create necessary directories
    mkdir -p .wwebjs_auth .puppeteer_cache
    echo "📁 Session directories created"
fi

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=256"

# Start the application
echo "🌟 Starting Node.js application..."
exec node server.js
