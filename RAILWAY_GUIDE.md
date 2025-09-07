# Railway Deployment Guide 🚀

## Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## Manual Deployment

### 1. Fork & Connect
1. Fork this repository to your GitHub
2. Go to [Railway.app](https://railway.app) and sign up
3. Create new project and connect your forked repo

### 2. Environment Variables
Add these in Railway Dashboard → Variables:

```env
NODE_ENV=production
RAILWAY=true
PORT=8080
SEND_DELAY_MS=1000
SHOP_NAME=Your Shop Name
SHOP_PHONE=Your Shop Phone
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Chrome timeout fixes for Railway
PUPPETEER_TIMEOUT=60000
WHATSAPP_INIT_TIMEOUT=90000
CHROME_DEVEL_SANDBOX=false
DISPLAY=:99
NODE_OPTIONS=--max-old-space-size=512 --expose-gc --optimize-for-size
```

### 3. Deploy & Monitor
1. Railway auto-deploys from your repo
2. Monitor logs in Railway Dashboard → Observability → Logs
3. Wait for "🚀 Server running on port 8080"

## WhatsApp Setup

1. Visit your Railway URL: `https://your-app.railway.app/scanner`
2. Scan QR code with WhatsApp mobile app
3. Verify at: `https://your-app.railway.app/session-status`

## Testing

Send POST to `/webhook/order-ready`:
```json
{
  "name": "John Doe",
  "phone": "1234567890",
  "item": "Shirt",
  "dueDate": "2024-01-15",
  "price": 500
}
```

## Troubleshooting

### Chrome Initialization Timeout
**Symptoms:** Logs show "❌ Initialization attempt failed: Initialization timeout"

**Fix:** Add these Railway environment variables:
```
PUPPETEER_TIMEOUT=60000
WHATSAPP_INIT_TIMEOUT=90000
CHROME_DEVEL_SANDBOX=false
```

### DNS Issues
**Symptoms:** "Site can't be reached" or DNS errors

**Fix:** 
1. Check Railway deployment status is "Deployed" (green)
2. Wait 5-10 minutes for full deployment
3. Verify correct URL from Railway dashboard

### Memory Issues
**Symptoms:** App crashes or high memory usage

**Fix:** Railway limits to 512MB - the app is pre-optimized for this

### Build Failures
**Symptoms:** npm install fails with package-lock conflicts

**Fix:** Already handled - package-lock.json is automatically removed

## Support

- [Railway Docs](https://docs.railway.app)
- [Project Issues](https://github.com/mrsaurabhtanwar/tailoring-whatsapp-bot/issues)
- [WhatsApp Web.js Docs](https://wwebjs.dev)

## Success Checklist

- [ ] Build completes successfully
- [ ] App accessible at Railway URL
- [ ] Health check returns 200: `/healthz`
- [ ] QR scanner loads: `/scanner`
- [ ] WhatsApp authentication works
- [ ] Test webhook processes messages

**Your Railway deployment is ready! 🎉**
