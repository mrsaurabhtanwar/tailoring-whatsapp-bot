#!/bin/bash

# Railway Deployment Test Script
# This script tests if the package-lock.json issue is resolved

echo "🔧 Testing Railway deployment configuration..."

# Check if package-lock.json exists (it shouldn't)
if [ -f "package-lock.json" ]; then
    echo "⚠️  Warning: package-lock.json exists - removing it..."
    rm -f package-lock.json
else
    echo "✅ package-lock.json not present (good)"
fi

# Test npm install without package-lock
echo "📦 Testing npm install without package-lock..."
npm install --no-package-lock --dry-run

if [ $? -eq 0 ]; then
    echo "✅ npm install test passed"
else
    echo "❌ npm install test failed"
    exit 1
fi

# Check if all required files exist
echo "📁 Checking required files..."

required_files=("railway.toml" "nixpacks.toml" "Dockerfile" "server.js" "package.json")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check if unnecessary files are removed
echo "🗑️  Checking unnecessary files are removed..."

unnecessary_files=("render.toml" "azure-quick-deploy.ps1" "docker-compose.yml")

for file in "${unnecessary_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "✅ $file removed (good)"
    else
        echo "⚠️  $file still exists (should be removed)"
    fi
done

# Check package.json content
echo "📋 Checking package.json configuration..."

if grep -q "railway" package.json; then
    echo "✅ Railway configuration found in package.json"
else
    echo "⚠️  Railway configuration missing in package.json"
fi

if grep -q "23.11.1" package.json; then
    echo "✅ Puppeteer version updated to 23.11.1"
else
    echo "⚠️  Puppeteer version may need updating"
fi

echo ""
echo "🎉 Railway deployment configuration test completed!"
echo ""
echo "Next steps:"
echo "1. Commit and push changes to GitHub"
echo "2. Deploy to Railway"
echo "3. Monitor build logs for success"
echo "4. Test endpoints after deployment"
echo ""
echo "📚 See RAILWAY_TROUBLESHOOTING.md for detailed help"
