#!/bin/bash

# Render startup script for WhatsApp Bot
echo "🚀 Starting WhatsApp Bot deployment..."

# Check if we're on Render
if [ "$RENDER" = "true" ]; then
    echo "📦 Running on Render platform"
    
    # Let Puppeteer download Chrome automatically
    echo "🌐 Puppeteer will handle Chrome installation automatically"
    
    # Create necessary directories
    mkdir -p .wwebjs_auth .puppeteer_cache
    echo "📁 Session directories created"
fi

# Set memory limits with garbage collection
export NODE_OPTIONS="--max-old-space-size=200 --gc-interval=100 --expose-gc"

# Start the application
echo "🌟 Starting Node.js application..."
exec node server.js
