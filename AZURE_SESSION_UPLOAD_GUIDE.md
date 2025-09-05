# Azure Deployment Guide for WhatsApp Bot
# Your WhatsApp is already authenticated locally - we'll upload the session to Azure

## 🎯 Strategy: Upload Existing Session (No QR Needed!)

Since you have a working WhatsApp session locally, we'll:
1. **Upload your session** to Azure (no QR generation needed)
2. **Configure Azure** for optimal performance
3. **Deploy with session** - WhatsApp will work immediately

## 🚀 Step 1: Prepare Your Code for Azure

### Update package.json for Azure
```json
{
  "scripts": {
    "start": "node --max-old-space-size=512 server.js",
    "dev": "node server.js",
    "azure-start": "node --max-old-space-size=460 server.js"
  }
}
```

### Create Azure-specific startup script
```bash
#!/bin/bash
# azure-start.sh - Optimized startup for Azure
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=460"
node server.js
```

## 🔧 Step 2: Azure Configuration

### Required Environment Variables
Set these in Azure Portal → Configuration → Application settings:

```bash
# Core settings
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=460
WEBSITE_NODE_DEFAULT_VERSION=20.19.3

# WhatsApp settings
WHATSAPP_SESSION_PATH=/home/site/wwwroot/.wwebjs_auth
WHATSAPP_CLIENT_ID=tailoring-shop-bot

# Optional: External Chrome (if needed)
# BROWSER_WS_URL=wss://chrome.browserless.io
```

### Azure App Service Settings
```bash
# Build settings
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
POST_BUILD_SCRIPT_PATH=post-build.sh

# Performance
WEBSITE_RUN_FROM_PACKAGE=1
WEBSITE_ENABLE_SYNC_UPDATE_SITE=true
```

## 📦 Step 3: Upload Session to Azure

### Method A: Using Azure Portal (Easiest)
1. Go to Azure Portal → Your App Service
2. Navigate to: **Development Tools** → **Advanced Tools** → **Go**
3. Click **Debug console** → **CMD**
4. Navigate to: `site/wwwroot`
5. Upload your `.wwebjs_auth` folder

### Method B: Using Kudu API
```bash
# Upload session folder via Kudu
curl -X PUT "https://tailoring-whats-bot-hvheavb3bbhfbsdn.scm.centralindia-01.azurewebsites.net/api/vfs/site/wwwroot/.wwebjs_auth" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @.wwebjs_auth
```

### Method C: Using Azure CLI (If you have it)
```bash
# Zip the session folder
tar -czf session.tar.gz .wwebjs_auth

# Upload via Azure CLI
az webapp deployment source config-zip \
  --name tailoring-whats-bot-hvheavb3bbhfbsdn \
  --resource-group DefaultResourceGroup-CIN \
  --src session.tar.gz
```

## 🚀 Step 4: Deploy Your Code

### Deploy with GitHub Actions
```bash
git add .
git commit -m "Azure deployment with existing WhatsApp session"
git push origin main
```

### Manual Deploy
```bash
# If you have Azure CLI
az webapp deployment source config-zip \
  --name tailoring-whats-bot-hvheavb3bbhfbsdn \
  --resource-group DefaultResourceGroup-CIN \
  --src deploy.zip
```

## 🔍 Step 5: Verify Deployment

### Check Health
```bash
curl https://tailoring-whats-bot-hvheavb3bbhfbsdn.centralindia-01.azurewebsites.net/
```

### Check WhatsApp Status
```bash
curl https://tailoring-whats-bot-hvheavb3bbhfbsdn.centralindia-01.azurewebsites.net/session-status
```

### Expected Response
```json
{
  "authenticated": true,
  "sessionExists": true,
  "qrCodeRequired": false,
  "sessionInfo": {
    "readyAt": "2025-09-05T22:30:00.000Z"
  }
}
```

## 🎯 Step 6: Test WhatsApp Functionality

### Send Test Message
```bash
curl -X POST https://tailoring-whats-bot-hvheavb3bbhfbsdn.centralindia-01.azurewebsites.net/webhook/order-ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "phone": "1234567890",
    "item": "Test Garment",
    "orderDate": "2025-09-05",
    "dueDate": "2025-09-10",
    "price": 1000
  }'
```

## 🔧 Troubleshooting

### If WhatsApp Still Not Ready
1. **Check logs**: Azure Portal → Log stream
2. **Verify session**: Check if `.wwebjs_auth` folder exists
3. **Restart app**: Azure Portal → Restart
4. **Check permissions**: Ensure session folder has correct permissions

### Common Issues
- **Session not found**: Re-upload `.wwebjs_auth` folder
- **Permission denied**: Check folder permissions in Azure
- **Memory issues**: Increase `NODE_OPTIONS` memory limit
- **Timeout**: Increase `authTimeoutMs` in client config

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Health check shows `"whatsappReady": true`
- ✅ Session status shows `"authenticated": true`
- ✅ No QR code required (`"qrCodeRequired": false`)
- ✅ Test message sends successfully

## 💡 Pro Tips

1. **Keep session backup**: Download `.wwebjs_auth` folder locally as backup
2. **Monitor logs**: Watch Azure Log stream for any errors
3. **Test regularly**: Send test messages to verify functionality
4. **Scale if needed**: If performance issues, scale to B1 tier

## 🚨 Important Notes

- **Session is tied to your phone**: Don't log out WhatsApp on your phone
- **Backup session**: Keep a copy of `.wwebjs_auth` folder
- **Don't regenerate QR**: Your existing session will work on Azure
- **Monitor usage**: Watch for any rate limits or errors
