#!/bin/bash
# Post-build script for Azure B3 tier
# Optimized for B3 tier with proper Chrome installation

echo "🔧 Running post-build setup for Azure B3 tier..."

# Navigate to app directory
cd /home/site/wwwroot

# Install all dependencies first
echo "📦 Installing all dependencies..."
npm install --production

# Install Chrome dependencies for B3 tier
echo "🔧 Installing Chrome dependencies..."
apt-get update -qq
apt-get install -y -qq \
    wget \
    gnupg \
    unzip \
    curl \
    xvfb

# Install Google Chrome
echo "🌐 Installing Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update -qq
apt-get install -y -qq google-chrome-stable

# Verify installations
echo "🔍 Verifying installations..."
if command -v google-chrome &> /dev/null; then
    echo "✅ Google Chrome installed successfully"
    google-chrome --version
else
    echo "❌ Google Chrome installation failed"
fi

if [ -d "node_modules/puppeteer" ]; then
    echo "✅ Puppeteer installed successfully"
else
    echo "❌ Puppeteer installation failed"
fi

# Create necessary directories for WhatsApp Web.js
echo "📁 Creating WhatsApp directories..."
mkdir -p .wwebjs_auth
mkdir -p .wwebjs_cache
chmod 755 .wwebjs_auth .wwebjs_cache

# Set Chrome path for Puppeteer
echo "🔧 Setting Chrome path..."
export CHROME_BIN=/usr/bin/google-chrome-stable

echo "✅ B3 tier post-build setup completed"
