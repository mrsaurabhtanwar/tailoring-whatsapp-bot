# PowerShell script to manually test and monitor Cyclic WhatsApp bot
# Use this if Google Apps Script is not accessible

param(
    [string]$BotUrl = "https://your-app.cyclic.app",
    [int]$TestInterval = 300,  # 5 minutes in seconds
    [switch]$Continuous = $false
)

Write-Host "🧪 Cyclic WhatsApp Bot Manual Testing Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

if ($BotUrl -eq "https://your-app.cyclic.app") {
    $BotUrl = Read-Host "Enter your Cyclic bot URL (e.g., https://your-app.cyclic.app)"
}

if (-not $BotUrl.StartsWith("https://")) {
    $BotUrl = "https://" + $BotUrl
}

Write-Host "🤖 Bot URL: $BotUrl" -ForegroundColor Yellow
Write-Host "⏱️ Test Interval: $($TestInterval) seconds" -ForegroundColor Yellow
Write-Host ""

function Test-BotHealth {
    param([string]$Url)
    
    try {
        Write-Host "🔄 Testing bot health..." -ForegroundColor Yellow
        
        $healthResponse = Invoke-WebRequest -Uri "$Url/" -Method GET -UseBasicParsing -TimeoutSec 30
        $statusCode = $healthResponse.StatusCode
        
        if ($statusCode -eq 200) {
            Write-Host "✅ Health Check: $statusCode - Bot is healthy" -ForegroundColor Green
            
            # Try to get response content
            try {
                $content = $healthResponse.Content | ConvertFrom-Json
                if ($content.whatsappReady) {
                    Write-Host "✅ WhatsApp is ready!" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ WhatsApp not ready yet" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "ℹ️ Response received but not JSON" -ForegroundColor Blue
            }
            
            return $true
        } else {
            Write-Host "⚠️ Health Check: $statusCode - Unexpected status" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-QRCode {
    param([string]$Url)
    
    try {
        Write-Host "📱 Checking QR code..." -ForegroundColor Yellow
        
        $qrResponse = Invoke-WebRequest -Uri "$Url/qr" -Method GET -UseBasicParsing -TimeoutSec 30
        $statusCode = $qrResponse.StatusCode
        
        if ($statusCode -eq 200) {
            Write-Host "✅ QR Code Available - Ready to scan!" -ForegroundColor Green
            Write-Host "   QR URL: $Url/qr" -ForegroundColor White
            return $true
        } elseif ($statusCode -eq 404) {
            Write-Host "ℹ️ QR Not Available Yet (Expected during startup)" -ForegroundColor Blue
            return $false
        } else {
            Write-Host "⚠️ QR Endpoint: $statusCode - Unexpected status" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ QR Check Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-SessionStatus {
    param([string]$Url)
    
    try {
        Write-Host "🔍 Checking session status..." -ForegroundColor Yellow
        
        $sessionResponse = Invoke-RestMethod -Uri "$Url/session-status" -Method GET -TimeoutSec 30
        
        Write-Host "✅ Session Status Retrieved" -ForegroundColor Green
        Write-Host "   Authenticated: $($sessionResponse.authenticated)" -ForegroundColor White
        Write-Host "   Session Exists: $($sessionResponse.sessionExists)" -ForegroundColor White
        Write-Host "   QR Required: $($sessionResponse.qrCodeRequired)" -ForegroundColor White
        Write-Host "   Environment: $($sessionResponse.environment)" -ForegroundColor White
        
        if ($sessionResponse.sessionInfo) {
            Write-Host "   Ready At: $($sessionResponse.sessionInfo.readyAt)" -ForegroundColor White
        }
        
        return $sessionResponse.authenticated
    } catch {
        Write-Host "❌ Session Status Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Send-TestMessage {
    param([string]$Url)
    
    try {
        Write-Host "📤 Sending test message..." -ForegroundColor Yellow
        
        $testMessage = @{
            name = "Test Customer"
            phone = "1234567890"  # Replace with your test number
            item = "Test Garment"
            orderDate = (Get-Date).ToString("yyyy-MM-dd")
            dueDate = (Get-Date).AddDays(5).ToString("yyyy-MM-dd")
            price = 1000
            advancePayment = 500
            remainingAmount = 500
        }
        
        $response = Invoke-RestMethod -Uri "$Url/webhook/order-ready" -Method POST -Body ($testMessage | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30
        
        Write-Host "✅ Test Message Sent Successfully!" -ForegroundColor Green
        Write-Host "   Response: $($response.message)" -ForegroundColor White
        
        return $true
    } catch {
        Write-Host "❌ Test Message Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Run-FullTest {
    param([string]$Url)
    
    Write-Host ""
    Write-Host "🧪 Running Full Bot Test - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    
    $healthOk = Test-BotHealth -Url $Url
    $qrOk = Test-QRCode -Url $Url
    $sessionOk = Test-SessionStatus -Url $Url
    
    if ($healthOk -and $sessionOk) {
        Write-Host ""
        Write-Host "🎉 Bot is fully functional!" -ForegroundColor Green
        
        # Ask if user wants to send test message
        $sendTest = Read-Host "Send test message? (y/n)"
        if ($sendTest -eq "y" -or $sendTest -eq "Y") {
            Send-TestMessage -Url $Url
        }
    } elseif ($healthOk -and $qrOk) {
        Write-Host ""
        Write-Host "📱 Bot is running but needs WhatsApp authentication" -ForegroundColor Yellow
        Write-Host "   Scan QR code at: $Url/qr" -ForegroundColor White
    } elseif ($healthOk) {
        Write-Host ""
        Write-Host "⚠️ Bot is running but QR not ready yet" -ForegroundColor Yellow
        Write-Host "   Wait 2-3 minutes and try again" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Bot is not responding" -ForegroundColor Red
        Write-Host "   Check Cyclic deployment logs" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📊 Test Summary:" -ForegroundColor Cyan
    Write-Host "   Health Check: $(if($healthOk) {'✅ Pass'} else {'❌ Fail'})" -ForegroundColor White
    Write-Host "   QR Code: $(if($qrOk) {'✅ Available'} else {'⚠️ Not Ready'})" -ForegroundColor White
    Write-Host "   Session: $(if($sessionOk) {'✅ Authenticated'} else {'⚠️ Not Ready'})" -ForegroundColor White
}

# Main execution
if ($Continuous) {
    Write-Host "🔄 Starting continuous monitoring..." -ForegroundColor Green
    Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    
    $testCount = 0
    while ($true) {
        $testCount++
        Write-Host "🧪 Test #$testCount - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
        
        Run-FullTest -Url $BotUrl
        
        Write-Host ""
        Write-Host "⏳ Waiting $($TestInterval) seconds until next test..." -ForegroundColor Yellow
        Start-Sleep -Seconds $TestInterval
    }
} else {
    Run-FullTest -Url $BotUrl
}

Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Use -Continuous switch for ongoing monitoring" -ForegroundColor White
Write-Host "   • Set up UptimeRobot for automated monitoring" -ForegroundColor White
Write-Host "   • Check Cyclic logs if bot is not responding" -ForegroundColor White
Write-Host "   • Replace test phone number with your actual number" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful URLs:" -ForegroundColor Yellow
Write-Host "   Health: $BotUrl/" -ForegroundColor White
Write-Host "   QR Code: $BotUrl/qr" -ForegroundColor White
Write-Host "   Session: $BotUrl/session-status" -ForegroundColor White
Write-Host "   Webhook: $BotUrl/webhook/order-ready" -ForegroundColor White
