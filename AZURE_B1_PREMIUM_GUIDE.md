# Azure B1 Premium Tier Deployment Guide
# This will solve all your QR generation and profile lock issues

## 🎯 Why Azure B1 Tier?

### Problems with F1 Tier:
- ❌ **1GB RAM** - Not enough for Chrome
- ❌ **Sleep mode** - App goes to sleep
- ❌ **Sandbox restrictions** - Chrome can't run properly
- ❌ **Profile lock issues** - Multiple Chrome instances conflict

### Solutions with B1 Tier:
- ✅ **1.75GB RAM** - Plenty for Chrome + WhatsApp
- ✅ **Always-on** - No sleep mode
- ✅ **Full Chrome support** - No sandbox restrictions
- ✅ **No profile locks** - Stable Chrome operation
- ✅ **Reliable QR generation** - Works consistently

## 🚀 Step-by-Step Azure B1 Deployment

### Step 1: Scale Up to B1 Tier

**Option A: Azure Portal (Easiest)**
1. Go to: https://portal.azure.com
2. Search for: `tailoring-whats-bot-hvheavb3bbhfbsdn`
3. Click on your App Service
4. Navigate to: **Settings** → **Scale up (App Service plan)**
5. Select: **B1 Basic** plan
6. Click: **Apply**
7. Wait 2-3 minutes for scaling to complete

**Option B: Azure CLI**
```bash
az appservice plan update \
  --name tailoring-whats-bot-hvheavb3bbhfbsdn \
  --resource-group DefaultResourceGroup-CIN \
  --sku B1
```

### Step 2: Update Your Code for B1 Tier

Update your `server.js` to use the premium client:

```javascript
// Replace this line in server.js:
const AzureWhatsAppClient = require("./whatsapp-client-azure");

// With this:
const PremiumWhatsAppClient = require("./whatsapp-client-premium");
const whatsappClient = new PremiumWhatsAppClient();
```

### Step 3: Set B1-Optimized Environment Variables

In Azure Portal → Configuration → Application settings:

```bash
# Core settings
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=1024
WEBSITE_NODE_DEFAULT_VERSION=20.19.3

# B1 tier optimizations
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
POST_BUILD_SCRIPT_PATH=post-build.sh

# WhatsApp settings
WHATSAPP_SESSION_PATH=/home/site/wwwroot/.wwebjs_auth
WHATSAPP_CLIENT_ID=tailoring-shop-bot-premium

# Chrome settings (B1 tier can handle these)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
CHROME_BIN=/usr/bin/google-chrome-stable
```

### Step 4: Deploy Your Updated Code

```bash
git add .
git commit -m "Upgrade to Azure B1 tier with premium WhatsApp client"
git push origin main
```

### Step 5: Upload Your Session (Optional)

Since B1 tier can generate QR codes reliably, you have two options:

**Option A: Generate New QR (Recommended)**
- Let B1 tier generate a fresh QR code
- Scan it with your phone
- This ensures no profile lock issues

**Option B: Upload Existing Session**
- Use your existing `.wwebjs_auth` folder
- Upload via Azure Portal or PowerShell script

## 🔧 B1 Tier Configuration

### Updated post-build.sh for B1:
```bash
#!/bin/bash
# Post-build script for Azure B1 tier
echo "🔧 Running post-build setup for Azure B1..."

# Navigate to app directory
cd /home/site/wwwroot

# Install Puppeteer with Chromium for B1
echo "📦 Installing Puppeteer with Chromium..."
npm install puppeteer --save

# Install Chrome dependencies
echo "🔧 Installing Chrome dependencies..."
apt-get update
apt-get install -y google-chrome-stable

# Verify Chromium installation
if [ -d "node_modules/puppeteer/.local-chromium" ]; then
    echo "✅ Puppeteer Chromium installed successfully"
else
    echo "❌ Puppeteer Chromium installation failed"
fi

# Create necessary directories for WhatsApp Web.js
mkdir -p .wwebjs_auth
mkdir -p .wwebjs_cache
chmod 755 .wwebjs_auth .wwebjs_cache

echo "✅ B1 tier post-build setup completed"
```

## 🎯 Expected Results with B1 Tier

### After Deployment:
- ✅ **QR code generates** within 30-60 seconds
- ✅ **No profile lock errors**
- ✅ **WhatsApp client initializes** properly
- ✅ **Stable connection** maintained
- ✅ **No sleep mode** issues

### Health Check Response:
```json
{
  "status": "Tailoring Shop Bot Running",
  "whatsappReady": true,
  "qrCodeAvailable": false,
  "environment": "Azure B1",
  "memory": "1.75GB"
}
```

## 💰 Cost Comparison

| Tier | RAM | Always-on | Cost/Month | QR Generation |
|------|-----|-----------|------------|---------------|
| F1   | 1GB | ❌ Sleep  | Free       | ❌ Fails     |
| B1   | 1.75GB | ✅ Always | ~$13      | ✅ Works     |

## 🔍 Troubleshooting B1 Tier

### If QR Still Doesn't Generate:
1. **Check logs**: Azure Portal → Log stream
2. **Restart app**: Azure Portal → Restart
3. **Verify scaling**: Ensure B1 tier is active
4. **Check memory**: Should show 1.75GB available

### Common B1 Tier Issues:
- **Still on F1**: Wait for scaling to complete
- **Memory errors**: Increase `NODE_OPTIONS` to `--max-old-space-size=1024`
- **Chrome not found**: Check `post-build.sh` execution

## 🎉 Success Checklist

- [ ] Scaled to B1 tier
- [ ] Updated environment variables
- [ ] Deployed updated code
- [ ] QR code generates successfully
- [ ] WhatsApp client ready
- [ ] Test message sends

## 🚀 Next Steps

1. **Scale to B1 tier** (2-3 minutes)
2. **Update environment variables** (1 minute)
3. **Deploy updated code** (2-3 minutes)
4. **Test QR generation** (1-2 minutes)
5. **Scan QR and authenticate** (1 minute)

**Total time: ~10 minutes for a fully working WhatsApp bot!**

Your Azure B1 tier will provide a professional, reliable hosting environment for your WhatsApp bot with no sleep mode issues and perfect QR generation! 🎉
