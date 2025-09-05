# PowerShell script for Cyclic deployment
# This script helps you deploy your WhatsApp bot to Cyclic

param(
    [string]$CyclicUrl = ""
)

Write-Host "🚀 Cyclic Deployment Script for WhatsApp Bot" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Cyclic Benefits:" -ForegroundColor Yellow
Write-Host "   ✅ 1GB RAM (Best free tier)" -ForegroundColor White
Write-Host "   ✅ No-sleep deployments" -ForegroundColor White
Write-Host "   ✅ 10,000 API requests" -ForegroundColor White
Write-Host "   ✅ Serverless cron tasks" -ForegroundColor White
Write-Host "   ✅ Easy GitHub deployment" -ForegroundColor White
Write-Host ""

# Step 1: Check if code is ready
Write-Host "1️⃣ Checking if code is ready for deployment..." -ForegroundColor Yellow

if (-not (Test-Path "server.js")) {
    Write-Host "❌ server.js not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "whatsapp-client-premium.js")) {
    Write-Host "❌ whatsapp-client-premium.js not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All required files found" -ForegroundColor Green

# Step 2: Check Git status
Write-Host ""
Write-Host "2️⃣ Checking Git status..." -ForegroundColor Yellow

try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "📝 Uncommitted changes found:" -ForegroundColor Yellow
        Write-Host $gitStatus -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Committing changes..." -ForegroundColor Yellow
        git add .
        git commit -m "Deploy to Cyclic - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        Write-Host "✅ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "✅ No uncommitted changes" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Git error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Push to GitHub
Write-Host ""
Write-Host "3️⃣ Pushing to GitHub..." -ForegroundColor Yellow

try {
    git push origin main
    Write-Host "✅ Code pushed to GitHub successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to push to GitHub: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Deploy to Cyclic
Write-Host ""
Write-Host "4️⃣ Deploy to Cyclic..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Manual Steps:" -ForegroundColor Yellow
Write-Host "   1. Go to: https://cyclic.sh" -ForegroundColor White
Write-Host "   2. Sign up with GitHub" -ForegroundColor White
Write-Host "   3. Click 'Deploy from GitHub'" -ForegroundColor White
Write-Host "   4. Select your repository" -ForegroundColor White
Write-Host "   5. Click 'Deploy'" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Waiting for you to complete Cyclic deployment..." -ForegroundColor Yellow
Write-Host "   Press Enter when your Cyclic URL is ready..." -ForegroundColor White
Read-Host

# Step 5: Get Cyclic URL
if (-not $CyclicUrl) {
    $CyclicUrl = Read-Host "Enter your Cyclic URL (e.g., https://your-app.cyclic.app)"
}

if (-not $CyclicUrl.StartsWith("https://")) {
    $CyclicUrl = "https://" + $CyclicUrl
}

if (-not $CyclicUrl.EndsWith(".cyclic.app")) {
    Write-Host "⚠️ URL should end with .cyclic.app" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "5️⃣ Testing Cyclic deployment..." -ForegroundColor Yellow

# Test health endpoint
try {
    $healthResponse = Invoke-WebRequest -Uri "$CyclicUrl/" -Method GET -UseBasicParsing -TimeoutSec 30
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Cyclic deployment is working!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Cyclic deployment responded with status: $($healthResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not reach Cyclic deployment: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure your Cyclic URL is correct and deployment is complete" -ForegroundColor Yellow
}

# Step 6: Set up Google Apps Script
Write-Host ""
Write-Host "6️⃣ Google Apps Script Setup..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Go to: https://script.google.com" -ForegroundColor White
Write-Host "   2. Create new project" -ForegroundColor White
Write-Host "   3. Copy the Google Script code from CYCLIC_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "   4. Replace CYCLIC_URL with: $CyclicUrl" -ForegroundColor White
Write-Host "   5. Set up trigger every 20 minutes" -ForegroundColor White
Write-Host ""

# Step 7: Test QR generation
Write-Host "7️⃣ Testing QR generation..." -ForegroundColor Yellow

try {
    $qrResponse = Invoke-WebRequest -Uri "$CyclicUrl/qr" -Method GET -UseBasicParsing -TimeoutSec 30
    
    if ($qrResponse.StatusCode -eq 200) {
        Write-Host "✅ QR code is available!" -ForegroundColor Green
        Write-Host "   QR URL: $CyclicUrl/qr" -ForegroundColor White
    } elseif ($qrResponse.StatusCode -eq 404) {
        Write-Host "ℹ️ QR not available yet (expected during startup)" -ForegroundColor Blue
        Write-Host "   Wait 2-3 minutes and check: $CyclicUrl/qr" -ForegroundColor White
    } else {
        Write-Host "⚠️ QR endpoint returned status: $($qrResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not check QR endpoint: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Summary
Write-Host ""
Write-Host "🎉 Cyclic Deployment Summary" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Code pushed to GitHub" -ForegroundColor White
Write-Host "✅ Cyclic deployment ready" -ForegroundColor White
Write-Host "✅ Bot URL: $CyclicUrl" -ForegroundColor White
Write-Host "✅ Health Check: $CyclicUrl/" -ForegroundColor White
Write-Host "✅ QR Code: $CyclicUrl/qr" -ForegroundColor White
Write-Host "✅ Session Status: $CyclicUrl/session-status" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Set up Google Apps Script (see CYCLIC_DEPLOYMENT_GUIDE.md)" -ForegroundColor White
Write-Host "   2. Wait 2-3 minutes for QR generation" -ForegroundColor White
Write-Host "   3. Scan QR code with your phone" -ForegroundColor White
Write-Host "   4. Test message sending" -ForegroundColor White
Write-Host ""
Write-Host "💰 Total Cost: $0 (Free forever!)" -ForegroundColor Green
Write-Host "🚀 Your WhatsApp bot is now running on Cyclic!" -ForegroundColor Green
