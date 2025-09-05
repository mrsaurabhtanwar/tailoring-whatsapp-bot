#!/bin/bash
# Post-build script for Azure App Service
# Ensures Puppeteer Chromium is properly installed

echo "🔧 Running post-build setup for Azure..."

# Navigate to app directory
cd /home/site/wwwroot

# Install Puppeteer with Chromium for Azure
echo "📦 Installing Puppeteer with Chromium..."
npm install puppeteer --save

# Verify Chromium installation
if [ -d "node_modules/puppeteer/.local-chromium" ]; then
    echo "✅ Puppeteer Chromium installed successfully"
    ls -la node_modules/puppeteer/.local-chromium/
else
    echo "❌ Puppeteer Chromium installation failed"
fi

# Create necessary directories for WhatsApp Web.js
mkdir -p .wwebjs_auth
mkdir -p .wwebjs_cache
chmod 755 .wwebjs_auth .wwebjs_cache

echo "✅ Post-build setup completed"
