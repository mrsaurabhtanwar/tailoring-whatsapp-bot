# Cyclic Deployment Guide for WhatsApp Bot

## 🚀 Why Cyclic is Perfect for Your WhatsApp Bot

Cyclic offers the **best free hosting** for WhatsApp bots:
- ✅ **1GB RAM** - Best memory allocation (double Railway/Render)
- ✅ **No-sleep deployments** - Never goes to sleep
- ✅ **10,000 API requests** - More than enough for 30-40 messages/day
- ✅ **Serverless cron tasks** - Built-in scheduling
- ✅ **Easy GitHub deployment** - One-click setup
- ✅ **Full Chrome/Puppeteer support** - Perfect for WhatsApp Web.js

## 📋 Step-by-Step Cyclic Deployment

### Step 1: Create Cyclic Account
1. Go to: https://cyclic.sh
2. Click **"Sign Up"**
3. Sign up with **GitHub**
4. Authorize Cyclic to access your repositories

### Step 2: Deploy Your Bot
1. Click **"Deploy from GitHub"**
2. Select your `tailoring-whatsapp-bot` repository
3. Click **"Deploy"**
4. Cyclic will automatically detect Node.js and deploy

### Step 3: Configure Environment Variables
In Cyclic dashboard, go to your app → **Environment** tab:

```bash
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=800
PORT=3000
```

### Step 4: Get Your Cyclic URL
After deployment, Cyclic will provide a URL like:
`https://tailoring-whatsapp-bot.cyclic.app`

### Step 5: Test Your Deployment
1. **Health Check**: `https://your-app.cyclic.app/`
2. **QR Code**: `https://your-app.cyclic.app/qr`
3. **Session Status**: `https://your-app.cyclic.app/session-status`

## 🔧 Cyclic-Specific Configuration

### Update package.json for Cyclic:
```json
{
  "scripts": {
    "start": "node --max-old-space-size=800 server.js",
    "dev": "node server.js"
  }
}
```

### Cyclic will automatically:
- ✅ Install dependencies
- ✅ Build your app
- ✅ Start with `npm start`
- ✅ Provide HTTPS URL
- ✅ Handle restarts
- ✅ Keep app awake (no sleep mode)

## 📱 Google Apps Script for Cyclic

### Complete Google Apps Script Code:
```javascript
// Google Apps Script to keep Cyclic WhatsApp bot awake
// Replace YOUR_CYCLIC_URL with your actual Cyclic URL

const CYCLIC_URL = 'https://tailoring-whatsapp-bot.cyclic.app';

function keepBotAwake() {
  try {
    console.log('🔄 Pinging Cyclic bot...');
    
    const response = UrlFetchApp.fetch(CYCLIC_URL + '/healthz', {
      method: 'GET',
      muteHttpExceptions: true,
      timeout: 30000
    });
    
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log(`Health check: ${statusCode}`);
    
    if (statusCode === 200) {
      console.log('✅ Cyclic bot is awake and healthy');
      
      // Optional: Send test message every 20th ping (5 hours)
      if (Math.random() < 0.05) {
        sendTestMessage();
      }
    } else {
      console.log(`⚠️ Bot responded with status: ${statusCode}`);
      // Try to wake up by hitting main endpoint
      wakeUpBot();
    }
    
  } catch (error) {
    console.log(`❌ Error pinging Cyclic bot: ${error.toString()}`);
    wakeUpBot();
  }
}

function wakeUpBot() {
  try {
    console.log('🔔 Attempting to wake up Cyclic bot...');
    const response = UrlFetchApp.fetch(CYCLIC_URL + '/', {
      method: 'GET',
      muteHttpExceptions: true,
      timeout: 30000
    });
    console.log(`Wake-up response: ${response.getResponseCode()}`);
  } catch (error) {
    console.log(`❌ Wake-up failed: ${error.toString()}`);
  }
}

function sendTestMessage() {
  try {
    console.log('📱 Sending test message...');
    
    const testMessage = {
      name: "Test Customer",
      phone: "1234567890", // Replace with your test number
      item: "Test Garment",
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 1000,
      advancePayment: 500,
      remainingAmount: 500
    };
    
    const response = UrlFetchApp.fetch(CYCLIC_URL + '/webhook/order-ready', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(testMessage),
      muteHttpExceptions: true,
      timeout: 30000
    });
    
    console.log(`Test message status: ${response.getResponseCode()}`);
    
  } catch (error) {
    console.log(`❌ Test message failed: ${error.toString()}`);
  }
}

function setupTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'keepBotAwake') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger to run every 20 minutes (Cyclic doesn't need frequent pings)
  ScriptApp.newTrigger('keepBotAwake')
    .timeBased()
    .everyMinutes(20)
    .create();
    
  console.log('✅ Cyclic bot trigger set up every 20 minutes');
}

function testCyclicBot() {
  console.log('🧪 Testing Cyclic bot connection...');
  keepBotAwake();
}
```

## 🎯 Cyclic Deployment Checklist

### Before Deployment:
- [ ] Cyclic account created
- [ ] GitHub repository connected
- [ ] Environment variables set
- [ ] Code committed to GitHub

### After Deployment:
- [ ] Cyclic URL obtained
- [ ] Health check passes
- [ ] QR code generates
- [ ] Google Script configured
- [ ] Trigger set up
- [ ] Test message sent

## 📊 Cyclic Usage Monitoring

### Check Usage:
1. Go to Cyclic dashboard
2. Click on your app
3. Check **Metrics** tab
4. Monitor:
   - **CPU usage**
   - **Memory usage**
   - **API requests**
   - **Response times**

### Expected Usage for 30-40 messages/day:
- **CPU**: < 5% average
- **Memory**: < 300MB average
- **API requests**: < 100/day
- **Response time**: < 1 second

## 🔧 Troubleshooting Cyclic

### Common Issues:

1. **Build Fails**:
   - Check `package.json` scripts
   - Verify Node.js version
   - Check build logs in Cyclic dashboard

2. **App Crashes**:
   - Check memory usage (should be < 1GB)
   - Reduce `NODE_OPTIONS` memory limit
   - Check application logs

3. **QR Not Generating**:
   - Check Chrome dependencies
   - Verify Puppeteer installation
   - Check application logs

4. **Google Script Fails**:
   - Verify Cyclic URL is correct
   - Check trigger is active
   - Test manual ping

## 🎉 Success Indicators

### Cyclic Deployment:
- ✅ **App deploys successfully**
- ✅ **Health check returns 200**
- ✅ **QR code generates**
- ✅ **WhatsApp authenticates**
- ✅ **Messages send successfully**

### Google Script:
- ✅ **Trigger runs every 20 minutes**
- ✅ **Health checks pass**
- ✅ **Bot stays awake**
- ✅ **Test messages work**

## 💰 Cost Summary

| Service | Cost | Usage |
|---------|------|-------|
| Cyclic | **Free** | 1GB RAM, 10K requests |
| Google Apps Script | **Free** | Unlimited triggers |
| WhatsApp | **Free** | Personal messages |
| **Total** | **$0** | **Forever** |

## 🚀 Quick Start Commands

### Deploy to Cyclic:
```bash
git add .
git commit -m "Deploy to Cyclic with Google Script triggers"
git push origin main
```

### Set up Google Script:
1. Go to: https://script.google.com
2. Create new project
3. Paste the Google Script code
4. Replace `CYCLIC_URL` with your actual URL
5. Set up trigger every 20 minutes

## 🎯 Why Cyclic is Better Than Others

| Feature | Cyclic | Railway | Render |
|---------|--------|---------|--------|
| RAM | **1GB** | 512MB | 512MB |
| Sleep Mode | **Never** | Never | Never |
| API Requests | **10K** | Unlimited | Unlimited |
| Setup | **Easiest** | Easy | Easy |
| Performance | **Best** | Good | Good |

Your Cyclic + Google Script setup will give you the **best free WhatsApp bot** with maximum resources and reliability! 🚀
