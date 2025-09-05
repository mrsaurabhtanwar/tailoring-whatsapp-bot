# Quick Azure Fix Instructions

## Option A: Add Environment Variable via Azure Portal
1. Go to https://portal.azure.com
2. Navigate to your App Service: `tailoring-whatsapp-bot-esgvfsbtbeh4eefp`
3. Go to Settings → Configuration
4. Click "New application setting"
5. Add:
   - Name: `BROWSER_WS_URL`
   - Value: `wss://chrome.browserless.io`
6. Click Save → Continue

## Option B: Use Free Remote Chrome Service
1. Sign up at https://www.browserless.io (free tier)
2. Get your token
3. Set environment variable:
   - Name: `BROWSER_WS_URL` 
   - Value: `wss://chrome.browserless.io?token=YOUR_TOKEN`

## Option C: Scale Up Temporarily (Paid)
If you want to use local Chrome on Azure:
1. Go to App Service → Scale up
2. Change from F1 to B1 Basic (minimal cost ~$13/month)
3. After QR setup, scale back to F1

## Option D: Deploy Updated Code
Your current code should work with remote Chrome. Just redeploy:

```bash
git add .
git commit -m "Azure Chrome optimization"
git push origin main
```

The GitHub Action will deploy automatically.

## Testing
After setting BROWSER_WS_URL:
1. Restart your Azure app
2. Check: https://tailoring-whatsapp-bot-esgvfsbtbeh4eefp.centralindia-01.azurewebsites.net/qr
3. Should show QR code within 30-60 seconds
