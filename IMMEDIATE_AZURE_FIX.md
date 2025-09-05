# IMMEDIATE AZURE FIX - Set Environment Variable

## STEP 1: Add BROWSER_WS_URL Environment Variable

### Method A: Azure Portal (Easiest)
1. Go to: https://portal.azure.com
2. Search for: `tailoring-whatsapp-bot-esgvfsbtbeh4eefp`
3. Click on your App Service
4. In left menu: Settings → Configuration
5. Under "Application settings" click: + New application setting
6. Set:
   - **Name**: `BROWSER_WS_URL`
   - **Value**: `wss://chrome.browserless.io`
7. Click OK → Save
8. Wait for Azure to restart your app (30-60 seconds)

### Method B: Azure CLI (If you have it installed)
```bash
az webapp config appsettings set \
  --name tailoring-whatsapp-bot-esgvfsbtbeh4eefp \
  --resource-group DefaultResourceGroup-CIN \
  --settings BROWSER_WS_URL="wss://chrome.browserless.io"
```

## STEP 2: Test After 2-3 Minutes
- Check: https://tailoring-whatsapp-bot-esgvfsbtbeh4eefp.centralindia-01.azurewebsites.net/
- Should show: `"whatsappReady": false` but no errors
- Check: https://tailoring-whatsapp-bot-esgvfsbtbeh4eefp.centralindia-01.azurewebsites.net/qr
- Should show QR code image or better error messages

## STEP 3: If Still No QR (Alternative)
Try with a free token from browserless.io:
1. Sign up at: https://www.browserless.io
2. Get your free token
3. Update the environment variable to:
   - **Value**: `wss://chrome.browserless.io?token=YOUR_FREE_TOKEN`

## Expected Timeline
- Environment variable update: 1 minute
- App restart: 30-60 seconds  
- QR generation: 30-120 seconds
- **Total**: 2-4 minutes

## If This Doesn't Work
The issue might be deeper Azure F1 restrictions. Next options:
1. Scale to B1 tier temporarily ($13/month)
2. Try alternative hosting (Railway, Render, DigitalOcean)
3. Use local development for initial WhatsApp setup
