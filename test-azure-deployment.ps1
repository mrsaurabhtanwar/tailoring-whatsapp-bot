# Test script for Azure WhatsApp Bot deployment
# This script tests your deployed bot to ensure everything is working

param(
    [string]$AppUrl = "https://tailoring-whats-bot-hvheavb3bbhfbsdn.centralindia-01.azurewebsites.net"
)

Write-Host "🧪 Testing Azure WhatsApp Bot deployment..." -ForegroundColor Green
Write-Host "🌐 App URL: $AppUrl" -ForegroundColor Yellow

# Test 1: Health Check
Write-Host ""
Write-Host "1️⃣ Testing Health Check..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$AppUrl/" -Method GET
    Write-Host "✅ Health Check: $($healthResponse.status)" -ForegroundColor Green
    Write-Host "   WhatsApp Ready: $($healthResponse.whatsappReady)" -ForegroundColor White
    Write-Host "   QR Available: $($healthResponse.qrCodeAvailable)" -ForegroundColor White
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Session Status
Write-Host ""
Write-Host "2️⃣ Testing Session Status..." -ForegroundColor Yellow
try {
    $sessionResponse = Invoke-RestMethod -Uri "$AppUrl/session-status" -Method GET
    Write-Host "✅ Session Status Retrieved" -ForegroundColor Green
    Write-Host "   Authenticated: $($sessionResponse.authenticated)" -ForegroundColor White
    Write-Host "   Session Exists: $($sessionResponse.sessionExists)" -ForegroundColor White
    Write-Host "   QR Required: $($sessionResponse.qrCodeRequired)" -ForegroundColor White
    Write-Host "   Environment: $($sessionResponse.environment)" -ForegroundColor White
    Write-Host "   Session Path Exists: $($sessionResponse.sessionPathExists)" -ForegroundColor White
    
    if ($sessionResponse.sessionInfo) {
        Write-Host "   Ready At: $($sessionResponse.sessionInfo.readyAt)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Session Status Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: QR Endpoint
Write-Host ""
Write-Host "3️⃣ Testing QR Endpoint..." -ForegroundColor Yellow
try {
    $qrResponse = Invoke-WebRequest -Uri "$AppUrl/qr" -Method GET -UseBasicParsing
    if ($qrResponse.StatusCode -eq 200) {
        Write-Host "✅ QR Endpoint: Returns QR image" -ForegroundColor Green
    } else {
        Write-Host "⚠️  QR Endpoint: Status $($qrResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse.StatusCode -eq 404) {
        Write-Host "ℹ️  QR Endpoint: No QR available (expected if authenticated)" -ForegroundColor Blue
    } else {
        Write-Host "❌ QR Endpoint Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Test Message (if authenticated)
Write-Host ""
Write-Host "4️⃣ Testing WhatsApp Message..." -ForegroundColor Yellow

# Get session status first
try {
    $sessionResponse = Invoke-RestMethod -Uri "$AppUrl/session-status" -Method GET
    
    if ($sessionResponse.authenticated) {
        Write-Host "✅ WhatsApp is authenticated - testing message..." -ForegroundColor Green
        
        $testMessage = @{
            name = "Test Customer"
            phone = "1234567890"
            item = "Test Garment"
            orderDate = (Get-Date).ToString("yyyy-MM-dd")
            dueDate = (Get-Date).AddDays(5).ToString("yyyy-MM-dd")
            price = 1000
            advancePayment = 500
            remainingAmount = 500
        } | ConvertTo-Json
        
        try {
            $messageResponse = Invoke-RestMethod -Uri "$AppUrl/webhook/order-ready" -Method POST -Body $testMessage -ContentType "application/json"
            Write-Host "✅ Test Message: $($messageResponse.message)" -ForegroundColor Green
        } catch {
            Write-Host "❌ Test Message Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  WhatsApp not authenticated - skipping message test" -ForegroundColor Yellow
        Write-Host "💡 Upload your .wwebjs_auth session folder to Azure" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Could not check authentication status" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "📋 Test Summary:" -ForegroundColor Green
Write-Host "   - Health Check: $($healthResponse.status)" -ForegroundColor White
Write-Host "   - WhatsApp Ready: $($healthResponse.whatsappReady)" -ForegroundColor White
Write-Host "   - Session Exists: $($sessionResponse.sessionExists)" -ForegroundColor White
Write-Host "   - QR Required: $($sessionResponse.qrCodeRequired)" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
if ($healthResponse.whatsappReady) {
    Write-Host "   ✅ Your bot is ready to send WhatsApp messages!" -ForegroundColor Green
    Write-Host "   📱 Test it by sending a webhook request" -ForegroundColor White
} else {
    Write-Host "   🔧 Upload your .wwebjs_auth session folder to Azure" -ForegroundColor White
    Write-Host "   📱 Use the upload-session-to-azure.ps1 script" -ForegroundColor White
    Write-Host "   🔄 Or upload manually via Azure Portal" -ForegroundColor White
}

Write-Host ""
Write-Host "🔗 Useful URLs:" -ForegroundColor Yellow
Write-Host "   Health: $AppUrl/" -ForegroundColor White
Write-Host "   Session: $AppUrl/session-status" -ForegroundColor White
Write-Host "   QR: $AppUrl/qr" -ForegroundColor White
Write-Host "   Webhook: $AppUrl/webhook/order-ready" -ForegroundColor White
