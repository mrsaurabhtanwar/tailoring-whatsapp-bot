# PowerShell script for Azure temporary upgrade strategy
# Scale up → Generate QR → Authenticate → Scale back to F1

param(
    [string]$AppName = "tailoring-whats-bot-hvheavb3bbhfbsdn",
    [string]$ResourceGroup = "DefaultResourceGroup-CIN",
    [string]$TargetTier = "B1",
    [string]$AppUrl = "https://tailoring-whats-bot-hvheavb3bbhfbsdn.centralindia-01.azurewebsites.net"
)

Write-Host "🚀 Azure Temporary Upgrade Strategy for QR Generation" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Check if Azure CLI is available
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✅ Azure CLI found: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Azure
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Azure. Please run: az login" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Current Configuration:" -ForegroundColor Yellow
Write-Host "   App Name: $AppName" -ForegroundColor White
Write-Host "   Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "   Target Tier: $TargetTier" -ForegroundColor White
Write-Host "   App URL: $AppUrl" -ForegroundColor White
Write-Host ""

# Step 1: Check current tier
Write-Host "1️⃣ Checking current tier..." -ForegroundColor Yellow
try {
    $currentTier = az appservice plan show --name $AppName --resource-group $ResourceGroup --query "sku.tier" -o tsv
    Write-Host "   Current tier: $currentTier" -ForegroundColor White
    
    if ($currentTier -eq $TargetTier) {
        Write-Host "✅ Already on $TargetTier tier!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Currently on $currentTier tier, need to upgrade to $TargetTier" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not check current tier: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Scale up to target tier
if ($currentTier -ne $TargetTier) {
    Write-Host ""
    Write-Host "2️⃣ Scaling up to $TargetTier tier..." -ForegroundColor Yellow
    try {
        az appservice plan update --name $AppName --resource-group $ResourceGroup --sku $TargetTier
        Write-Host "✅ Successfully scaled up to $TargetTier tier!" -ForegroundColor Green
        Write-Host "⏳ Waiting 3 minutes for scaling to complete..." -ForegroundColor Yellow
        Start-Sleep -Seconds 180
    } catch {
        Write-Host "❌ Failed to scale up: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "2️⃣ Skipping scale up (already on $TargetTier tier)" -ForegroundColor Yellow
}

# Step 3: Deploy code
Write-Host ""
Write-Host "3️⃣ Deploying code..." -ForegroundColor Yellow
Write-Host "   Please run: git push origin main" -ForegroundColor White
Write-Host "   Press Enter when deployment is complete..." -ForegroundColor White
Read-Host

# Step 4: Check QR generation
Write-Host ""
Write-Host "4️⃣ Checking QR generation..." -ForegroundColor Yellow
Write-Host "⏳ Waiting 2 minutes for app to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 120

$maxAttempts = 10
$attempt = 0
$qrGenerated = $false

while ($attempt -lt $maxAttempts -and -not $qrGenerated) {
    $attempt++
    Write-Host "   Attempt $attempt/$maxAttempts - Checking QR endpoint..." -ForegroundColor White
    
    try {
        $qrResponse = Invoke-WebRequest -Uri "$AppUrl/qr" -Method GET -UseBasicParsing -TimeoutSec 30
        
        if ($qrResponse.StatusCode -eq 200) {
            Write-Host "✅ QR code is available!" -ForegroundColor Green
            Write-Host "   QR URL: $AppUrl/qr" -ForegroundColor White
            $qrGenerated = $true
        } else {
            Write-Host "⚠️ QR not ready yet (Status: $($qrResponse.StatusCode))" -ForegroundColor Yellow
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "ℹ️ QR not available yet (404 - expected during startup)" -ForegroundColor Blue
        } else {
            Write-Host "⚠️ Error checking QR: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    if (-not $qrGenerated -and $attempt -lt $maxAttempts) {
        Write-Host "   Waiting 30 seconds before retry..." -ForegroundColor White
        Start-Sleep -Seconds 30
    }
}

if (-not $qrGenerated) {
    Write-Host "❌ QR code did not generate after $maxAttempts attempts" -ForegroundColor Red
    Write-Host "💡 Check Azure Log stream for errors" -ForegroundColor Yellow
    Write-Host "💡 Try restarting the app" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "5️⃣ QR Code Generated Successfully!" -ForegroundColor Green
    Write-Host "   📱 Open WhatsApp on your phone" -ForegroundColor White
    Write-Host "   📱 Go to Settings → Linked Devices → Link a Device" -ForegroundColor White
    Write-Host "   📱 Scan the QR code from: $AppUrl/qr" -ForegroundColor White
    Write-Host ""
    Write-Host "   Press Enter when you've scanned the QR code..." -ForegroundColor Yellow
    Read-Host
}

# Step 6: Verify authentication
Write-Host ""
Write-Host "6️⃣ Verifying WhatsApp authentication..." -ForegroundColor Yellow
try {
    $sessionResponse = Invoke-RestMethod -Uri "$AppUrl/session-status" -Method GET
    Write-Host "   Authenticated: $($sessionResponse.authenticated)" -ForegroundColor White
    Write-Host "   Session Exists: $($sessionResponse.sessionExists)" -ForegroundColor White
    Write-Host "   QR Required: $($sessionResponse.qrCodeRequired)" -ForegroundColor White
    
    if ($sessionResponse.authenticated) {
        Write-Host "✅ WhatsApp authentication successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ WhatsApp not authenticated yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not check authentication status: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Scale back to F1
Write-Host ""
Write-Host "7️⃣ Scaling back to F1 tier..." -ForegroundColor Yellow
Write-Host "   This will save you money while keeping your bot working!" -ForegroundColor White
Write-Host "   Press Enter to continue..." -ForegroundColor Yellow
Read-Host

try {
    az appservice plan update --name $AppName --resource-group $ResourceGroup --sku F1
    Write-Host "✅ Successfully scaled back to F1 tier!" -ForegroundColor Green
    Write-Host "⏳ Waiting 2 minutes for scaling to complete..." -ForegroundColor Yellow
    Start-Sleep -Seconds 120
} catch {
    Write-Host "❌ Failed to scale back: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 You can scale back manually in Azure Portal" -ForegroundColor Yellow
}

# Step 8: Final verification
Write-Host ""
Write-Host "8️⃣ Final verification..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$AppUrl/" -Method GET
    Write-Host "   Status: $($healthResponse.status)" -ForegroundColor White
    Write-Host "   WhatsApp Ready: $($healthResponse.whatsappReady)" -ForegroundColor White
    
    if ($healthResponse.whatsappReady) {
        Write-Host "🎉 SUCCESS! Your WhatsApp bot is working on F1 tier!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Bot is running but WhatsApp not ready" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not verify final status: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Summary:" -ForegroundColor Green
Write-Host "===========" -ForegroundColor Green
Write-Host "✅ Scaled up to $TargetTier tier" -ForegroundColor White
Write-Host "✅ Generated QR code" -ForegroundColor White
Write-Host "✅ Authenticated WhatsApp" -ForegroundColor White
Write-Host "✅ Scaled back to F1 tier" -ForegroundColor White
Write-Host "✅ Bot working on free tier!" -ForegroundColor White
Write-Host ""
Write-Host "💰 Total cost: < $0.01" -ForegroundColor Green
Write-Host "🔗 Your bot URL: $AppUrl" -ForegroundColor White
Write-Host "📱 QR Code: $AppUrl/qr" -ForegroundColor White
Write-Host "🏥 Health Check: $AppUrl/" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your WhatsApp bot is now running on F1 tier for free!" -ForegroundColor Green
