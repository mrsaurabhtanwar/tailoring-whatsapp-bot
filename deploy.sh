#!/bin/bash

# deploy.sh - Azure App Service Deployment Script
# Deploys WhatsApp Bot to Azure App Service F1 (Free Tier) using Azure CLI

set -e  # Exit on any error

echo "🚀 Starting Azure App Service deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_RESOURCE_GROUP="whatsapp-bot-rg"
DEFAULT_PLAN_NAME="whatsapp-bot-plan"
DEFAULT_REGION="centralindia"
DEFAULT_ZIP_PATH="whatsapp-bot.zip"

# Configuration from environment variables or CLI args
RESOURCE_GROUP="${RESOURCE_GROUP:-$DEFAULT_RESOURCE_GROUP}"
APP_NAME="${APP_NAME:-}"
PLAN_NAME="${PLAN_NAME:-$DEFAULT_PLAN_NAME}"
REGION="${REGION:-$DEFAULT_REGION}"
ZIP_PATH="${ZIP_PATH:-$DEFAULT_ZIP_PATH}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        --app-name)
            APP_NAME="$2"
            shift 2
            ;;
        --plan-name)
            PLAN_NAME="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --zip-path)
            ZIP_PATH="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --resource-group    Azure Resource Group (default: $DEFAULT_RESOURCE_GROUP)"
            echo "  --app-name          Azure App Service name (required)"
            echo "  --plan-name         App Service Plan name (default: $DEFAULT_PLAN_NAME)"
            echo "  --region            Azure region (default: $DEFAULT_REGION)"
            echo "  --zip-path          Path to deployment ZIP (default: $DEFAULT_ZIP_PATH)"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  RESOURCE_GROUP, APP_NAME, PLAN_NAME, REGION, ZIP_PATH"
            echo ""
            echo "Examples:"
            echo "  $0 --app-name my-whatsapp-bot"
            echo "  APP_NAME=my-bot $0"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$APP_NAME" ]]; then
    echo -e "${RED}❌ APP_NAME is required${NC}"
    echo "Set it as environment variable: export APP_NAME=your-app-name"
    echo "Or use command line: $0 --app-name your-app-name"
    exit 1
fi

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Name: $APP_NAME"
echo "  Plan Name: $PLAN_NAME"
echo "  Region: $REGION"
echo "  ZIP Path: $ZIP_PATH"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed${NC}"
    echo "Install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
echo -e "${YELLOW}🔐 Checking Azure authentication...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️ Not logged in to Azure. Please login:${NC}"
    az login
fi

# Get current subscription info
SUBSCRIPTION_INFO=$(az account show --query "{name:name, id:id}" -o tsv)
echo -e "${GREEN}✅ Logged in to Azure${NC}"
echo "  Subscription: $SUBSCRIPTION_INFO"
echo ""

# Step 1: Create or verify resource group
echo -e "${YELLOW}🏗️ Creating/verifying resource group...${NC}"
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✅ Resource group '$RESOURCE_GROUP' already exists${NC}"
else
    echo -e "${YELLOW}📦 Creating resource group '$RESOURCE_GROUP'...${NC}"
    az group create --name "$RESOURCE_GROUP" --location "$REGION" --output table
    echo -e "${GREEN}✅ Resource group created${NC}"
fi

# Step 2: Create or verify App Service Plan (F1 Free Tier)
echo -e "${YELLOW}🏗️ Creating/verifying App Service Plan...${NC}"
if az appservice plan show --name "$PLAN_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✅ App Service Plan '$PLAN_NAME' already exists${NC}"
    
    # Verify it's F1 tier
    PLAN_SKU=$(az appservice plan show --name "$PLAN_NAME" --resource-group "$RESOURCE_GROUP" --query "sku.name" -o tsv)
    if [[ "$PLAN_SKU" != "F1" ]]; then
        echo -e "${YELLOW}⚠️ Warning: Plan '$PLAN_NAME' is using SKU '$PLAN_SKU', not F1 (Free)${NC}"
    else
        echo -e "${GREEN}✅ Plan is using F1 (Free) tier${NC}"
    fi
else
    echo -e "${YELLOW}📦 Creating App Service Plan '$PLAN_NAME' with F1 (Free) tier...${NC}"
    az appservice plan create \
        --name "$PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$REGION" \
        --is-linux \
        --sku F1 \
        --output table
    echo -e "${GREEN}✅ App Service Plan created with F1 (Free) tier${NC}"
fi

# Step 3: Create or verify Web App
echo -e "${YELLOW}�️ Creating/verifying Web App...${NC}"
if az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✅ Web App '$APP_NAME' already exists${NC}"
    
    # Get app URL
    APP_URL=$(az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostName" -o tsv)
    echo -e "${GREEN}� App URL: https://$APP_URL${NC}"
else
    echo -e "${YELLOW}📦 Creating Web App '$APP_NAME'...${NC}"
    az webapp create \
        --resource-group "$RESOURCE_GROUP" \
        --plan "$PLAN_NAME" \
        --name "$APP_NAME" \
        --runtime "NODE|18-lts" \
        --output table
    
    APP_URL=$(az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostName" -o tsv)
    echo -e "${GREEN}✅ Web App created${NC}"
    echo -e "${GREEN}🌐 App URL: https://$APP_URL${NC}"
fi

# Step 4: Configure App Settings for optimal F1 performance
echo -e "${YELLOW}⚙️ Configuring App Settings...${NC}"
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings \
        WEBSITE_NODE_DEFAULT_VERSION=18.15.0 \
        SCM_DO_BUILD_DURING_DEPLOYMENT=true \
        NODE_ENV=production \
        WEBSITE_RUN_FROM_PACKAGE=1 \
        SEND_DELAY_MS=600 \
    --output table

echo -e "${GREEN}✅ App settings configured for F1 tier${NC}"

# Step 5: Build and create deployment ZIP
echo -e "${YELLOW}📦 Building and creating deployment package...${NC}"

# Clean previous build
rm -f "$ZIP_PATH"

# Update package.json for Azure if needed
if ! grep -q '"engines"' package.json; then
    echo -e "${YELLOW}⚙️ Adding Node.js engine specification to package.json...${NC}"
    # Backup original
    cp package.json package.json.backup
    
    # Add engines field using node.js
    node -e "
    const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
    pkg.engines = pkg.engines || {};
    pkg.engines.node = '18.x';
    pkg.engines.npm = '9.x';
    require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    echo -e "${GREEN}✅ Added engines field to package.json${NC}"
fi

# Install production dependencies
echo -e "${YELLOW}📦 Installing production dependencies...${NC}"
npm ci --production

# Create ZIP excluding unnecessary files
echo -e "${YELLOW}📦 Creating deployment ZIP...${NC}"
if command -v zip &> /dev/null; then
    zip -r "$ZIP_PATH" . \
        -x "node_modules/*" \
        -x ".git/*" \
        -x ".gitignore" \
        -x "*.log" \
        -x ".env*" \
        -x "package.json.backup" \
        -x ".wwebjs_auth/*" \
        -x "current-qr.png" \
        -x "*.zip" \
        -x "deploy.sh" \
        -x "verify.sh" \
        -x "README.md" \
        -x ".vscode/*" \
        -x ".github/*"
else
    echo -e "${RED}❌ zip command not found. Installing...${NC}"
    # Try to install zip
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y zip
    elif command -v yum &> /dev/null; then
        sudo yum install -y zip
    elif command -v brew &> /dev/null; then
        brew install zip
    else
        echo -e "${RED}❌ Cannot install zip. Please install it manually.${NC}"
        exit 1
    fi
    
    # Try again
    zip -r "$ZIP_PATH" . \
        -x "node_modules/*" \
        -x ".git/*" \
        -x ".gitignore" \
        -x "*.log" \
        -x ".env*" \
        -x "package.json.backup" \
        -x ".wwebjs_auth/*" \
        -x "current-qr.png" \
        -x "*.zip" \
        -x "deploy.sh" \
        -x "verify.sh" \
        -x "README.md" \
        -x ".vscode/*" \
        -x ".github/*"
fi

# Check ZIP size (F1 has 1GB limit)
ZIP_SIZE_MB=$(du -m "$ZIP_PATH" | cut -f1)
echo -e "${GREEN}✅ Deployment package created: $ZIP_PATH (${ZIP_SIZE_MB}MB)${NC}"

if [ "$ZIP_SIZE_MB" -gt 100 ]; then
    echo -e "${YELLOW}⚠️ Warning: Large deployment package (${ZIP_SIZE_MB}MB). Consider optimizing.${NC}"
fi

# Step 6: Deploy to Azure
echo -e "${YELLOW}🚀 Deploying to Azure App Service...${NC}"
echo "This may take a few minutes..."

az webapp deploy \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --src-path "$ZIP_PATH" \
    --type zip \
    --async false

echo -e "${GREEN}✅ Deployment completed${NC}"

# Step 7: Wait for app to be ready and perform health check
echo -e "${YELLOW}🏥 Performing post-deployment health check...${NC}"
HEALTH_URL="https://$APP_URL/health"
MAX_RETRIES=30
RETRY_DELAY=10

echo "Testing: $HEALTH_URL"
echo "This may take up to 5 minutes for cold start..."

for attempt in $(seq 1 $MAX_RETRIES); do
    echo -e "${YELLOW}⏳ Health check attempt $attempt/$MAX_RETRIES...${NC}"
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$HEALTH_URL" 2>/dev/null || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Health check passed! App is ready.${NC}"
        break
    elif [ "$HTTP_STATUS" = "503" ]; then
        echo -e "${YELLOW}⚠️ App is starting up... (HTTP $HTTP_STATUS)${NC}"
    else
        echo -e "${YELLOW}⚠️ Health check returned HTTP $HTTP_STATUS${NC}"
    fi
    
    if [ "$attempt" = "$MAX_RETRIES" ]; then
        echo -e "${RED}❌ Health check failed after $MAX_RETRIES attempts${NC}"
        echo "App may still be starting up. Check the Azure portal for logs."
        break
    fi
    
    sleep $RETRY_DELAY
done

# Step 8: Display final information
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED! 🎉${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "  🌐 App URL: https://$APP_URL"
echo "  🏥 Health Check: https://$APP_URL/health"
echo "  📷 QR Code: https://$APP_URL/qr"
echo "  📨 Webhook: https://$APP_URL/webhook/order-ready"
echo "  📊 Resource Group: $RESOURCE_GROUP"
echo "  💰 Tier: F1 (Free)"
echo ""
echo -e "${YELLOW}� Next Steps:${NC}"
echo "  1. Visit https://$APP_URL to check app status"
echo "  2. Scan QR code at https://$APP_URL/qr to authenticate WhatsApp"
echo "  3. Test webhook: curl -X POST https://$APP_URL/webhook/order-ready -H 'Content-Type: application/json' -d '{\"name\":\"Test\",\"phone\":\"1234567890\",\"item\":\"Test Order\"}'"
echo "  4. Monitor logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo -e "${BLUE}💡 Useful Commands:${NC}"
echo "  # Stream logs"
echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "  # Get publish profile for GitHub Actions"
echo "  az webapp deployment list-publishing-profiles --name $APP_NAME --resource-group $RESOURCE_GROUP --xml"
echo ""
echo "  # Restart app"
echo "  az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo -e "${GREEN}✅ Your WhatsApp Bot is now running on Azure App Service F1 (Free Tier)!${NC}"

# Cleanup
if [ -f "package.json.backup" ]; then
    echo -e "${YELLOW}🧹 Restoring original package.json...${NC}"
    mv package.json.backup package.json
fi

echo -e "${GREEN}🎯 Deployment script completed successfully!${NC}"
