## Azure Deployment Guidance

### Prerequisites
- Azure subscription with App Service Standard tier or higher (S1+)
- Azure CLI installed and logged in
- Docker Desktop installed locally

### Recommended Azure Configuration
- **App Service Plan**: Standard S1 or Premium P1V2 (for better performance)
- **Runtime Stack**: Docker Container (Linux)
- **Memory**: Minimum 1.75GB (S1) or 3.5GB (P1V2) recommended
- **Always On**: Enabled (prevents cold starts)

### Steps to Deploy

1. **Test locally first**:
   ```bash
   docker build -t tailoring-whatsapp-bot .
   docker run -p 8080:8080 tailoring-whatsapp-bot
   # Test at http://localhost:8080
   ```

2. **Create Azure Container Registry**:
   ```bash
   az group create --name WTBResourceGroup --location "East US"
   az acr create --resource-group WTBResourceGroup --name wtbregistry --sku Basic
   az acr login --name wtbregistry
   ```

3. **Build and push to ACR**:
   ```bash
   docker tag tailoring-whatsapp-bot wtbregistry.azurecr.io/tailoring-whatsapp-bot:latest
   docker push wtbregistry.azurecr.io/tailoring-whatsapp-bot:latest
   ```

4. **Create App Service Plan**:
   ```bash
   az appservice plan create \
     --name WTBPlan \
     --resource-group WTBResourceGroup \
     --sku S1 \
     --is-linux
   ```

5. **Create Web App**:
   ```bash
   az webapp create \
     --resource-group WTBResourceGroup \
     --plan WTBPlan \
     --name wtb-whatsapp-bot \
     --deployment-container-image-name wtbregistry.azurecr.io/tailoring-whatsapp-bot:latest
   ```

6. **Configure App Settings**:
   ```bash
   az webapp config appsettings set \
     --resource-group WTBResourceGroup \
     --name wtb-whatsapp-bot \
     --settings WEBSITES_PORT=8080 \
                NODE_ENV=production \
                SEND_DELAY_MS=600 \
                WEBSITES_ENABLE_APP_SERVICE_STORAGE=true
   ```

7. **Enable Container Registry authentication**:
   ```bash
   az webapp config container set \
     --name wtb-whatsapp-bot \
     --resource-group WTBResourceGroup \
     --docker-custom-image-name wtbregistry.azurecr.io/tailoring-whatsapp-bot:latest \
     --docker-registry-server-url https://wtbregistry.azurecr.io
   ```

8. **Monitor deployment**:
   ```bash
   az webapp log tail --name wtb-whatsapp-bot --resource-group WTBResourceGroup
   ```

### Production Configuration

#### Environment Variables to Set:
```bash
WEBSITES_PORT=8080
NODE_ENV=production
SEND_DELAY_MS=600
WEBSITES_ENABLE_APP_SERVICE_STORAGE=true
WEBSITE_NODE_DEFAULT_VERSION=20-lts
```

#### Optional Advanced Settings:
```bash
# For external Chrome service (if using)
BROWSER_WS_URL=wss://your-chrome-service.com

# For enhanced logging
WEBSITE_HTTPLOGGING_RETENTION_DAYS=7
```

### Monitoring and Maintenance

1. **View logs**:
   ```bash
   az webapp log download --name wtb-whatsapp-bot --resource-group WTBResourceGroup
   ```

2. **Scale up if needed**:
   ```bash
   az appservice plan update --name WTBPlan --resource-group WTBResourceGroup --sku P1V2
   ```

3. **Health check endpoint**: `https://wtb-whatsapp-bot.azurewebsites.net/health`

4. **Application Insights** (recommended):
   ```bash
   az monitor app-insights component create \
     --app wtb-insights \
     --location "East US" \
     --resource-group WTBResourceGroup
   ```

### Troubleshooting

- **Memory issues**: Upgrade to P1V2 or higher
- **Cold starts**: Enable "Always On" in Azure portal
- **WhatsApp QR**: Visit `/qr` endpoint after deployment
- **Logs**: Check Application Insights or download logs via CLI
- **Performance**: Monitor via Azure Portal metrics

### Security Best Practices

1. Enable HTTPS only
2. Set up custom domain with SSL
3. Configure IP restrictions if needed
4. Use managed identity for Azure services
5. Enable Application Insights for monitoring

### Cost Optimization

- Use S1 for development/testing
- Use P1V2 for production
- Enable auto-scaling based on CPU/memory
- Monitor costs via Azure Cost Management
