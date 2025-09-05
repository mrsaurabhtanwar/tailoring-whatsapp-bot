#!/bin/bash
# Azure-optimized deployment script for WhatsApp Bot
# This addresses common Azure App Service issues with Puppeteer/Chrome

echo "🚀 Deploying WhatsApp Bot to Azure with optimized settings..."

# Check if required environment variables are set
if [ -z "$AZURE_WEBAPP_NAME" ]; then
    echo "❌ AZURE_WEBAPP_NAME environment variable not set"
    echo "💡 Set it to: tailoring-whatsapp-bot-esgvfsbtbeh4eefp"
    exit 1
fi

if [ -z "$AZURE_RESOURCE_GROUP" ]; then
    echo "❌ AZURE_RESOURCE_GROUP environment variable not set"
    echo "💡 Set it to: DefaultResourceGroup-CIN"
    exit 1
fi

echo "📋 Using App Service: $AZURE_WEBAPP_NAME"
echo "📋 Using Resource Group: $AZURE_RESOURCE_GROUP"

# Set Azure-specific app settings for better Puppeteer support
echo "🔧 Configuring Azure app settings for Puppeteer support..."
az webapp config appsettings set \
  --name $AZURE_WEBAPP_NAME \
  --resource-group $AZURE_RESOURCE_GROUP \
  --settings \
    "NODE_OPTIONS=--max-old-space-size=460" \
    "WEBSITE_NODE_DEFAULT_VERSION=20.19.3" \
    "SCM_DO_BUILD_DURING_DEPLOYMENT=true" \
    "ENABLE_ORYX_BUILD=true" \
    "POST_BUILD_SCRIPT_PATH=post-build.sh"

echo "✅ Azure app settings configured for Puppeteer support"

# Check if BROWSER_WS_URL is already set
BROWSER_WS_URL=$(az webapp config appsettings list --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP --query "[?name=='BROWSER_WS_URL'].value" -o tsv)

if [ -z "$BROWSER_WS_URL" ]; then
    echo "⚠️  BROWSER_WS_URL not set. This is REQUIRED for Azure F1 tier!"
    echo "💡 Please set it manually:"
    echo "   az webapp config appsettings set --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP --settings BROWSER_WS_URL=\"wss://chrome.browserless.io\""
    echo ""
    echo "🔗 Or use Azure Portal:"
    echo "   1. Go to https://portal.azure.com"
    echo "   2. Navigate to your App Service"
    echo "   3. Settings → Configuration → Application settings"
    echo "   4. Add BROWSER_WS_URL = wss://chrome.browserless.io"
    echo ""
    echo "⏳ Continuing deployment without BROWSER_WS_URL (QR generation may fail)..."
else
    echo "✅ BROWSER_WS_URL is already configured: $BROWSER_WS_URL"
fi

# Deploy the application
echo "📦 Deploying application files..."
./deploy.sh

echo "🔧 Checking deployment status..."
DEPLOYMENT_STATE=$(az webapp show --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP --query "state" -o tsv)
echo "📊 Deployment state: $DEPLOYMENT_STATE"

echo "🌐 Application URL: https://$AZURE_WEBAPP_NAME.azurewebsites.net"
echo "🔍 Health Check: https://$AZURE_WEBAPP_NAME.azurewebsites.net/"
echo "📱 QR Code: https://$AZURE_WEBAPP_NAME.azurewebsites.net/qr"

echo "✅ Azure deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Wait 2-3 minutes for the app to fully start"
echo "   2. Check health: https://$AZURE_WEBAPP_NAME.azurewebsites.net/"
echo "   3. Check QR: https://$AZURE_WEBAPP_NAME.azurewebsites.net/qr"
echo "   4. Monitor logs: az webapp log tail --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP"
echo ""
echo "💡 If QR generation still fails:"
echo "   1. Set BROWSER_WS_URL environment variable (see instructions above)"
echo "   2. Restart the app: az webapp restart --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP"
echo "   3. Scale up from F1 to B1 tier temporarily for initial setup"
