#!/bin/bash
# Azure deployment script for WhatsApp Bot with existing session
# This script deploys your code and uploads your existing WhatsApp session

echo "🚀 Deploying WhatsApp Bot to Azure with existing session..."

# Check if required environment variables are set
if [ -z "$AZURE_WEBAPP_NAME" ]; then
    echo "❌ AZURE_WEBAPP_NAME environment variable not set"
    echo "💡 Set it to: tailoring-whats-bot-hvheavb3bbhfbsdn"
    exit 1
fi

if [ -z "$AZURE_RESOURCE_GROUP" ]; then
    echo "❌ AZURE_RESOURCE_GROUP environment variable not set"
    echo "💡 Set it to: DefaultResourceGroup-CIN"
    exit 1
fi

echo "📋 Using App Service: $AZURE_WEBAPP_NAME"
echo "📋 Using Resource Group: $AZURE_RESOURCE_GROUP"

# Check if session folder exists
if [ ! -d ".wwebjs_auth" ]; then
    echo "❌ WhatsApp session folder not found!"
    echo "💡 Make sure you have a working .wwebjs_auth folder in your project"
    echo "💡 This folder contains your authenticated WhatsApp session"
    exit 1
fi

echo "✅ WhatsApp session folder found"

# Set Azure-specific app settings
echo "🔧 Configuring Azure app settings..."
az webapp config appsettings set \
  --name $AZURE_WEBAPP_NAME \
  --resource-group $AZURE_RESOURCE_GROUP \
  --settings \
    "NODE_ENV=production" \
    "NODE_OPTIONS=--max-old-space-size=460" \
    "WEBSITE_NODE_DEFAULT_VERSION=20.19.3" \
    "SCM_DO_BUILD_DURING_DEPLOYMENT=true" \
    "ENABLE_ORYX_BUILD=true" \
    "POST_BUILD_SCRIPT_PATH=post-build.sh" \
    "WHATSAPP_SESSION_PATH=/home/site/wwwroot/.wwebjs_auth" \
    "WHATSAPP_CLIENT_ID=tailoring-shop-bot"

echo "✅ Azure app settings configured"

# Deploy the application code
echo "📦 Deploying application code..."
./deploy.sh

# Upload the WhatsApp session
echo "📱 Uploading WhatsApp session..."
if [ -d ".wwebjs_auth" ]; then
    # Create a temporary zip file with the session
    TEMP_ZIP="session-$(date +%Y%m%d-%H%M%S).zip"
    
    echo "📦 Creating session archive..."
    zip -r $TEMP_ZIP .wwebjs_auth/
    
    echo "🚀 Uploading session to Azure..."
    az webapp deployment source config-zip \
        --name $AZURE_WEBAPP_NAME \
        --resource-group $AZURE_RESOURCE_GROUP \
        --src $TEMP_ZIP
    
    # Clean up
    rm $TEMP_ZIP
    echo "✅ Session uploaded successfully"
else
    echo "⚠️  No session folder found - WhatsApp will need to authenticate"
fi

echo "🔧 Checking deployment status..."
DEPLOYMENT_STATE=$(az webapp show --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP --query "state" -o tsv)
echo "📊 Deployment state: $DEPLOYMENT_STATE"

echo "🌐 Application URL: https://$AZURE_WEBAPP_NAME.azurewebsites.net"
echo "🔍 Health Check: https://$AZURE_WEBAPP_NAME.azurewebsites.net/"
echo "📱 Session Status: https://$AZURE_WEBAPP_NAME.azurewebsites.net/session-status"
echo "📨 Test Webhook: https://$AZURE_WEBAPP_NAME.azurewebsites.net/webhook/order-ready"

echo "✅ Azure deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Wait 2-3 minutes for the app to fully start"
echo "   2. Check health: https://$AZURE_WEBAPP_NAME.azurewebsites.net/"
echo "   3. Check session status: https://$AZURE_WEBAPP_NAME.azurewebsites.net/session-status"
echo "   4. Test WhatsApp functionality with a test message"
echo ""
echo "🎯 Expected Results:"
echo "   - whatsappReady: true"
echo "   - authenticated: true"
echo "   - qrCodeRequired: false"
echo ""
echo "💡 If WhatsApp is not ready:"
echo "   1. Check Azure Log stream for errors"
echo "   2. Restart the app: az webapp restart --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP"
echo "   3. Verify session folder was uploaded correctly"
echo "   4. Check if your phone is still connected to WhatsApp Web"
