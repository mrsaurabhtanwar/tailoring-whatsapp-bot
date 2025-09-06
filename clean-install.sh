#!/bin/bash

# Clean install script for Render
echo "🧹 Cleaning npm cache and package-lock..."

# Remove package-lock.json if it exists
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    echo "🗑️ Removed package-lock.json"
fi

# Clear npm cache
npm cache clean --force
echo "🧽 NPM cache cleared"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --no-package-lock --no-audit --no-fund --prefer-offline

echo "✅ Clean install completed"
