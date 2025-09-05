#!/bin/bash
# Azure-optimized deployment script for WhatsApp Bot
# This addresses common Azure App Service issues with Puppeteer/Chrome

echo "🚀 Deploying WhatsApp Bot to Azure with optimized settings..."

# Set Azure-specific app settings for better Puppeteer support
az webapp config appsettings set \
  --name $AZURE_WEBAPP_NAME \
  --resource-group $AZURE_RESOURCE_GROUP \
  --settings \
    "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false" \
    "PUPPETEER_EXECUTABLE_PATH=/home/site/wwwroot/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/chrome" \
    "NODE_OPTIONS=--max-old-space-size=460" \
    "WEBSITE_NODE_DEFAULT_VERSION=18.20.4" \
    "SCM_DO_BUILD_DURING_DEPLOYMENT=true" \
    "ENABLE_ORYX_BUILD=true" \
    "POST_BUILD_SCRIPT_PATH=post-build.sh"

echo "✅ Azure app settings configured for Puppeteer support"

# Deploy the application
echo "📦 Deploying application files..."
./deploy.sh

echo "🔧 Checking deployment status..."
az webapp show --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP --query "state" -o tsv

echo "🌐 Application URL: https://$AZURE_WEBAPP_NAME.azurewebsites.net"
echo "🔍 Health Check: https://$AZURE_WEBAPP_NAME.azurewebsites.net/"
echo "📱 QR Code: https://$AZURE_WEBAPP_NAME.azurewebsites.net/qr"

echo "✅ Azure deployment completed!"
echo ""
echo "💡 If QR generation still fails, try:"
echo "   1. Restart the app: az webapp restart --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP"
echo "   2. Check logs: az webapp log tail --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP"
echo "   3. Scale up from F1 to B1 tier temporarily for initial setup"
