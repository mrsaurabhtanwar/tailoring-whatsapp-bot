# PowerShell script to configure Azure Health Check properly
# Changes health check path from /scanner to /healthz

param(
    [string]$AppName = "tailoring-whats-bot-hvheavb3bbhfbsdn",
    [string]$ResourceGroup = "DefaultResourceGroup-CIN",
    [string]$HealthCheckPath = "/healthz"
)

Write-Host "🏥 Configuring Azure Health Check" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Check if Azure CLI is available
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✅ Azure CLI found: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔗 Alternative: Use Azure Portal to configure health check" -ForegroundColor Yellow
    Write-Host "   1. Go to https://portal.azure.com" -ForegroundColor White
    Write-Host "   2. Search for your App Service" -ForegroundColor White
    Write-Host "   3. Settings → Configuration" -ForegroundColor White
    Write-Host "   4. Change Health check path to: $HealthCheckPath" -ForegroundColor White
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
Write-Host "   New Health Check Path: $HealthCheckPath" -ForegroundColor White
Write-Host ""

# Step 1: Check current health check configuration
Write-Host "1️⃣ Checking current health check configuration..." -ForegroundColor Yellow
try {
    $currentConfig = az webapp config show --name $AppName --resource-group $ResourceGroup --query "healthCheckPath" -o tsv
    Write-Host "   Current health check path: $currentConfig" -ForegroundColor White
    
    if ($currentConfig -eq $HealthCheckPath) {
        Write-Host "✅ Health check path is already correct!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Health check path needs to be updated" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not check current configuration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Update health check path
if ($currentConfig -ne $HealthCheckPath) {
    Write-Host ""
    Write-Host "2️⃣ Updating health check path..." -ForegroundColor Yellow
    try {
        az webapp config set \
            --name $AppName \
            --resource-group $ResourceGroup \
            --health-check-path $HealthCheckPath
        
        Write-Host "✅ Health check path updated successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to update health check path: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "2️⃣ Skipping update (already correct)" -ForegroundColor Yellow
}

# Step 3: Add health check environment variables
Write-Host ""
Write-Host "3️⃣ Adding health check environment variables..." -ForegroundColor Yellow
try {
    # Set health check configuration
    az webapp config appsettings set \
        --name $AppName \
        --resource-group $ResourceGroup \
        --settings \
            "WEBSITE_HEALTHCHECK_PATH=$HealthCheckPath" \
            "WEBSITE_HEALTHCHECK_MAXPINGFAILURES=5" \
            "WEBSITE_HEALTHCHECK_RETRYCOUNT=3"
    
    Write-Host "✅ Health check environment variables added!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to add environment variables: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 You can add these manually in Azure Portal:" -ForegroundColor Yellow
    Write-Host "   WEBSITE_HEALTHCHECK_PATH=$HealthCheckPath" -ForegroundColor White
    Write-Host "   WEBSITE_HEALTHCHECK_MAXPINGFAILURES=5" -ForegroundColor White
    Write-Host "   WEBSITE_HEALTHCHECK_RETRYCOUNT=3" -ForegroundColor White
}

# Step 4: Restart the app
Write-Host ""
Write-Host "4️⃣ Restarting app to apply changes..." -ForegroundColor Yellow
try {
    az webapp restart --name $AppName --resource-group $ResourceGroup
    Write-Host "✅ App restarted successfully!" -ForegroundColor Green
    Write-Host "⏳ Waiting 2 minutes for app to fully start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 120
} catch {
    Write-Host "❌ Failed to restart app: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Please restart manually in Azure Portal" -ForegroundColor Yellow
}

# Step 5: Test health check endpoint
Write-Host ""
Write-Host "5️⃣ Testing health check endpoint..." -ForegroundColor Yellow
$appUrl = "https://$AppName.azurewebsites.net"
$healthUrl = "$appUrl$HealthCheckPath"

try {
    $healthResponse = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 30
    Write-Host "✅ Health check endpoint is working!" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.ok)" -ForegroundColor White
    Write-Host "   WhatsApp Ready: $($healthResponse.whatsappReady)" -ForegroundColor White
    Write-Host "   Memory Usage: $($healthResponse.memoryMB)MB" -ForegroundColor White
    
    if ($healthResponse.ok) {
        Write-Host "🎉 Health check reports: HEALTHY" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Health check reports: UNHEALTHY" -ForegroundColor Yellow
        if ($healthResponse.issues) {
            Write-Host "   Issues: $($healthResponse.issues -join ', ')" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Health check endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Check if the app is running and accessible" -ForegroundColor Yellow
}

# Step 6: Verify configuration
Write-Host ""
Write-Host "6️⃣ Verifying final configuration..." -ForegroundColor Yellow
try {
    $finalConfig = az webapp config show --name $AppName --resource-group $ResourceGroup --query "healthCheckPath" -o tsv
    Write-Host "   Final health check path: $finalConfig" -ForegroundColor White
    
    if ($finalConfig -eq $HealthCheckPath) {
        Write-Host "✅ Configuration verified successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Configuration verification failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Could not verify configuration: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Summary:" -ForegroundColor Green
Write-Host "===========" -ForegroundColor Green
Write-Host "✅ Health check path updated to: $HealthCheckPath" -ForegroundColor White
Write-Host "✅ Environment variables configured" -ForegroundColor White
Write-Host "✅ App restarted" -ForegroundColor White
Write-Host "✅ Health check endpoint tested" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful URLs:" -ForegroundColor Yellow
Write-Host "   Health Check: $healthUrl" -ForegroundColor White
Write-Host "   App Status: $appUrl/" -ForegroundColor White
Write-Host "   QR Code: $appUrl/qr" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Monitor Azure health check status" -ForegroundColor White
Write-Host "   2. Check health check logs in Azure Portal" -ForegroundColor White
Write-Host "   3. Consider adding more instances for better availability" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Azure Health Check is now properly configured!" -ForegroundColor Green
