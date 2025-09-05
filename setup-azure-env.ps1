# PowerShell script to set BROWSER_WS_URL environment variable for Azure
# Run this script to fix QR generation issues on Azure F1 tier

param(
    [string]$AppName = "tailoring-whatsapp-bot-esgvfsbtbeh4eefp",
    [string]$ResourceGroup = "DefaultResourceGroup-CIN",
    [string]$BrowserUrl = "wss://chrome.browserless.io"
)

Write-Host "🚀 Setting up Azure environment variable for WhatsApp Bot..." -ForegroundColor Green

# Check if Azure CLI is installed
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

Write-Host "🔧 Setting BROWSER_WS_URL environment variable..." -ForegroundColor Yellow

# Set the environment variable
try {
    az webapp config appsettings set `
        --name $AppName `
        --resource-group $ResourceGroup `
        --settings BROWSER_WS_URL="$BrowserUrl"
    
    Write-Host "✅ Environment variable set successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set environment variable: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Restarting Azure App Service..." -ForegroundColor Yellow

# Restart the app
try {
    az webapp restart --name $AppName --resource-group $ResourceGroup
    Write-Host "✅ App restarted successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restart app: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Setup completed! Next steps:" -ForegroundColor Green
Write-Host "   1. Wait 2-3 minutes for the app to fully start" -ForegroundColor White
Write-Host "   2. Check health: https://$AppName.azurewebsites.net/" -ForegroundColor White
Write-Host "   3. Check QR: https://$AppName.azurewebsites.net/qr" -ForegroundColor White
Write-Host "   4. Monitor logs: az webapp log tail --name $AppName --resource-group $ResourceGroup" -ForegroundColor White
Write-Host ""
Write-Host "💡 If QR generation still fails, try:" -ForegroundColor Yellow
Write-Host "   1. Get a free token from https://www.browserless.io" -ForegroundColor White
Write-Host "   2. Update BROWSER_WS_URL to include the token" -ForegroundColor White
Write-Host "   3. Scale up from F1 to B1 tier temporarily" -ForegroundColor White
