# GitHub Actions Azure Setup Guide

## 🚀 Setup GitHub Actions for Azure Deployment

This guide will help you set up automatic deployment to Azure using GitHub Actions.

### 1. Azure Service Principal Setup

Create a service principal for GitHub Actions:

```bash
# Login to Azure
az login

# Create service principal (replace with your subscription ID)
az ad sp create-for-rbac \
  --name "github-actions-wtb" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/WTBResourceGroup \
  --sdk-auth

# This will output JSON credentials - save them for step 2
```

### 2. GitHub Repository Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Required Secrets:
- **`AZURE_CREDENTIALS`**: The complete JSON output from step 1
- **`AZURE_SUBSCRIPTION_ID`**: Your Azure subscription ID

#### Optional Secrets (if you want to customize):
- **`AZURE_WEBAPP_NAME`**: Custom app name (default: wtb-whatsapp-bot)
- **`AZURE_RESOURCE_GROUP`**: Custom resource group (default: WTBResourceGroup)
- **`AZURE_REGISTRY_NAME`**: Custom registry name (default: wtbregistry)

### 3. Azure Resources Setup

Before the first deployment, create the required Azure resources:

```bash
# Create resource group
az group create --name WTBResourceGroup --location "East US"

# Create container registry
az acr create \
  --resource-group WTBResourceGroup \
  --name wtbregistry \
  --sku Basic \
  --admin-enabled true

# Create app service plan
az appservice plan create \
  --name WTBPlan \
  --resource-group WTBResourceGroup \
  --sku S1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group WTBResourceGroup \
  --plan WTBPlan \
  --name wtb-whatsapp-bot \
  --deployment-container-image-name "mcr.microsoft.com/appsvc/staticsite:latest"

# Configure app settings
az webapp config appsettings set \
  --resource-group WTBResourceGroup \
  --name wtb-whatsapp-bot \
  --settings WEBSITES_PORT=8080 \
             NODE_ENV=production \
             SEND_DELAY_MS=600 \
             WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
             WEBSITE_NODE_DEFAULT_VERSION=20-lts

# Enable Always On
az webapp config set \
  --resource-group WTBResourceGroup \
  --name wtb-whatsapp-bot \
  --always-on true
```

### 4. Repository Integration

#### Option A: New Repository
1. Create new repository: `tailoring-whatsapp-bot`
2. Push all files from this folder
3. Add the secrets from step 2
4. Push to main/master branch to trigger deployment

#### Option B: Existing Repository Merge
1. Back up your existing repository
2. Copy all files from this folder to your existing repo
3. Replace conflicting files with these versions
4. Add the secrets from step 2
5. Push to main/master branch

### 5. Deployment Workflow

The GitHub Action will:

1. **Build & Test**: 
   - Build Docker image
   - Test locally in GitHub runner
   - Verify health endpoints

2. **Deploy** (only on main/master):
   - Login to Azure
   - Push image to Azure Container Registry
   - Deploy to App Service
   - Verify deployment

3. **Notify**:
   - Show deployment status
   - Provide app URLs

### 6. Monitoring Deployment

- **GitHub Actions**: Monitor in your repo's Actions tab
- **Azure Portal**: Check App Service logs and metrics
- **App URLs**:
  - Main: `https://wtb-whatsapp-bot.azurewebsites.net`
  - Health: `https://wtb-whatsapp-bot.azurewebsites.net/health`
  - QR: `https://wtb-whatsapp-bot.azurewebsites.net/qr`

### 7. Troubleshooting

- **Deployment fails**: Check GitHub Actions logs
- **App doesn't start**: Check Azure App Service logs
- **Permission issues**: Verify service principal has correct permissions
- **Registry access**: Ensure ACR admin is enabled

### 8. Security Best Practices

- Use environment-specific resource groups
- Rotate service principal credentials regularly
- Enable Application Insights for monitoring
- Set up alerts for failures
- Use staging slots for zero-downtime deployments
