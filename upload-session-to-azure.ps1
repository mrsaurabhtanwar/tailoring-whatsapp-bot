# PowerShell script to upload WhatsApp session to Azure
# This will upload your existing .wwebjs_auth folder to Azure

param(
    [string]$AppName = "tailoring-whats-bot-hvheavb3bbhfbsdn",
    [string]$ResourceGroup = "DefaultResourceGroup-CIN",
    [string]$SessionPath = ".wwebjs_auth"
)

Write-Host "🚀 Uploading WhatsApp session to Azure..." -ForegroundColor Green

# Check if session folder exists
if (-not (Test-Path $SessionPath)) {
    Write-Host "❌ Session folder not found: $SessionPath" -ForegroundColor Red
    Write-Host "💡 Make sure you're in the correct directory with your WhatsApp session" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Session folder found: $SessionPath" -ForegroundColor Green

# Check if Azure CLI is available
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✅ Azure CLI found: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔗 Alternative: Use Azure Portal to upload session folder manually" -ForegroundColor Yellow
    Write-Host "   1. Go to https://portal.azure.com" -ForegroundColor White
    Write-Host "   2. Navigate to your App Service" -ForegroundColor White
    Write-Host "   3. Development Tools → Advanced Tools → Go" -ForegroundColor White
    Write-Host "   4. Debug console → CMD" -ForegroundColor White
    Write-Host "   5. Navigate to site/wwwroot" -ForegroundColor White
    Write-Host "   6. Upload your .wwebjs_auth folder" -ForegroundColor White
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

Write-Host "📦 Creating session archive..." -ForegroundColor Yellow

# Create a temporary zip file
$tempZip = "session-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
try {
    # Create zip file
    Compress-Archive -Path $SessionPath -DestinationPath $tempZip -Force
    Write-Host "✅ Session archive created: $tempZip" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create archive: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Uploading session to Azure..." -ForegroundColor Yellow

# Upload the session
try {
    az webapp deployment source config-zip `
        --name $AppName `
        --resource-group $ResourceGroup `
        --src $tempZip
    
    Write-Host "✅ Session uploaded successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to upload session: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try uploading manually via Azure Portal" -ForegroundColor Yellow
    exit 1
}

# Clean up temporary file
try {
    Remove-Item $tempZip -Force
    Write-Host "🧹 Cleaned up temporary files" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not clean up $tempZip" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Session upload completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 2-3 minutes for the app to process the session" -ForegroundColor White
Write-Host "   2. Check health: https://$AppName.azurewebsites.net/" -ForegroundColor White
Write-Host "   3. Check session status: https://$AppName.azurewebsites.net/session-status" -ForegroundColor White
Write-Host "   4. Test WhatsApp: Send a test message via webhook" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Expected results:" -ForegroundColor Yellow
Write-Host "   - whatsappReady: true" -ForegroundColor White
Write-Host "   - authenticated: true" -ForegroundColor White
Write-Host "   - qrCodeRequired: false" -ForegroundColor White
Write-Host ""
Write-Host "💡 If issues persist:" -ForegroundColor Yellow
Write-Host "   1. Check Azure Log stream for errors" -ForegroundColor White
Write-Host "   2. Restart the app in Azure Portal" -ForegroundColor White
Write-Host "   3. Verify session folder permissions" -ForegroundColor White
