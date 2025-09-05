# Azure Temporary Upgrade for QR Generation
# Scale up → Generate QR → Authenticate → Scale back to F1

## 🎯 Strategy Overview

1. **Scale up to B1** (5 minutes, ~$0.50 cost)
2. **Generate QR code** (2 minutes)
3. **Scan and authenticate** (1 minute)
4. **Scale back to F1** (1 minute)
5. **Total cost: < $1** for permanent solution!

## 🚀 Step-by-Step Process

### Step 1: Scale Up to B1 Tier

**Azure Portal Method:**
1. Go to: https://portal.azure.com
2. Search: `tailoring-whats-bot-hvheavb3bbhfbsdn`
3. Click: **Settings** → **Scale up (App Service plan)**
4. Select: **B1 Basic** → **Apply**
5. Wait 2-3 minutes

**Azure CLI Method:**
```bash
az appservice plan update \
  --name tailoring-whats-bot-hvheavb3bbhfbsdn \
  --resource-group DefaultResourceGroup-CIN \
  --sku B1
```

### Step 2: Deploy Your Bot

```bash
git add .
git commit -m "Deploy for B1 QR generation"
git push origin main
```

### Step 3: Generate QR Code

1. **Wait 2-3 minutes** for deployment
2. **Check logs**: Azure Portal → Log stream
3. **Look for**: "QR Code received! Generating files..."
4. **Visit**: https://tailoring-whats-bot-hvheavb3bbhfbsdn.centralindia-01.azurewebsites.net/qr

### Step 4: Authenticate WhatsApp

1. **Open WhatsApp** on your phone
2. **Tap**: Settings → Linked Devices → Link a Device
3. **Scan the QR code** from your Azure app
4. **Wait for**: "WhatsApp client is ready and authenticated!"

### Step 5: Scale Back to F1

**Azure Portal Method:**
1. Go to: **Settings** → **Scale up (App Service plan)**
2. Select: **F1 Free** → **Apply**
3. Wait 1-2 minutes

**Azure CLI Method:**
```bash
az appservice plan update \
  --name tailoring-whats-bot-hvheavb3bbhfbsdn \
  --resource-group DefaultResourceGroup-CIN \
  --sku F1
```

## 💰 Cost Breakdown

| Tier | Cost/Hour | Time Used | Total Cost |
|------|-----------|-----------|------------|
| B1   | ~$0.018   | 10 min    | ~$0.003    |
| F1   | Free      | Forever   | $0         |
| **Total** | | | **< $0.01** |

## 🔧 Environment Variables for B1

Set these in Azure Portal → Configuration:

```bash
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=1024
WEBSITE_NODE_DEFAULT_VERSION=20.19.3
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
```

## 📋 Quick Checklist

- [ ] Scale up to B1 tier
- [ ] Deploy updated code
- [ ] Check QR generation in logs
- [ ] Scan QR with phone
- [ ] Verify WhatsApp authentication
- [ ] Scale back to F1 tier
- [ ] Test bot still works on F1

## 🎯 Expected Timeline

- **Scaling up**: 2-3 minutes
- **Deployment**: 2-3 minutes
- **QR generation**: 30-60 seconds
- **Authentication**: 1 minute
- **Scaling down**: 1-2 minutes
- **Total time**: ~10 minutes

## 🔍 Troubleshooting

### If QR Doesn't Generate on B1:
1. **Check logs** for errors
2. **Restart app** in Azure Portal
3. **Verify B1 tier** is active
4. **Check environment variables**

### If Bot Stops Working After Scaling Down:
1. **Check session status**: `/session-status`
2. **Verify session exists**: `.wwebjs_auth` folder
3. **Restart app** on F1 tier
4. **Check memory usage** (should be low on F1)

## 🎉 Success Indicators

### After B1 Deployment:
- ✅ QR code generates successfully
- ✅ WhatsApp client initializes
- ✅ Authentication completes

### After F1 Scale Down:
- ✅ Bot continues working
- ✅ No QR code needed
- ✅ Session persists
- ✅ Cost remains $0

## 💡 Pro Tips

1. **Do this during off-peak hours** for faster scaling
2. **Keep session backup** locally
3. **Monitor logs** during the process
4. **Test immediately** after scaling down
5. **Don't log out** WhatsApp on your phone

## 🚨 Important Notes

- **Session is permanent** once authenticated
- **F1 tier can maintain** the authenticated session
- **Only QR generation** requires higher tier
- **Total cost is minimal** (< $0.01)
- **Bot works forever** on F1 after authentication

This strategy gives you a professional WhatsApp bot on F1 tier for free, with minimal upfront cost! 🎉
