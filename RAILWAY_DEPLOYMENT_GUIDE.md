# Railway Deployment Configuration for WhatsApp Bot

## 🚀 Railway Setup (Recommended Free Hosting)

Railway is the **best free option** for your WhatsApp bot because:
- ✅ **512MB RAM** - Perfect for Chrome/Puppeteer
- ✅ **500 hours/month** - More than enough for 30-40 messages/day
- ✅ **No sleep mode** - Always-on servers
- ✅ **Easy GitHub deployment**
- ✅ **Full Chrome support**

## 📋 Step-by-Step Railway Deployment

### Step 1: Create Railway Account
1. Go to: https://railway.app
2. Click **"Start a New Project"**
3. Sign up with **GitHub**
4. Authorize Railway to access your repositories

### Step 2: Deploy Your Bot
1. Click **"Deploy from GitHub repo"**
2. Select your `tailoring-whatsapp-bot` repository
3. Railway will automatically detect Node.js
4. Click **"Deploy Now"**

### Step 3: Configure Environment Variables
In Railway dashboard, go to your project → **Variables** tab:

```bash
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=400
PORT=3000
```

### Step 4: Get Your Railway URL
After deployment, Railway will provide a URL like:
`https://tailoring-whatsapp-bot-production.up.railway.app`

### Step 5: Test Your Deployment
1. **Health Check**: `https://your-url.railway.app/`
2. **QR Code**: `https://your-url.railway.app/qr`
3. **Session Status**: `https://your-url.railway.app/session-status`

## 🔧 Railway-Specific Configuration

### Update package.json for Railway:
```json
{
  "scripts": {
    "start": "node --max-old-space-size=400 server.js",
    "dev": "node server.js"
  }
}
```

### Railway will automatically:
- ✅ Install dependencies
- ✅ Build your app
- ✅ Start with `npm start`
- ✅ Provide HTTPS URL
- ✅ Handle restarts

## 📱 Google Apps Script for Railway

### Complete Google Apps Script Code:
```javascript
// Google Apps Script to keep Railway WhatsApp bot awake
// Replace YOUR_RAILWAY_URL with your actual Railway URL

const RAILWAY_URL = 'https://tailoring-whatsapp-bot-production.up.railway.app';

function keepBotAwake() {
  try {
    console.log('🔄 Pinging Railway bot...');
    
    const response = UrlFetchApp.fetch(RAILWAY_URL + '/healthz', {
      method: 'GET',
      muteHttpExceptions: true,
      timeout: 30000
    });
    
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log(`Health check: ${statusCode}`);
    
    if (statusCode === 200) {
      console.log('✅ Railway bot is awake and healthy');
      
      // Optional: Send test message every 10th ping (2.5 hours)
      if (Math.random() < 0.1) {
        sendTestMessage();
      }
    } else {
      console.log(`⚠️ Bot responded with status: ${statusCode}`);
      // Try to wake up by hitting main endpoint
      wakeUpBot();
    }
    
  } catch (error) {
    console.log(`❌ Error pinging Railway bot: ${error.toString()}`);
    wakeUpBot();
  }
}

function wakeUpBot() {
  try {
    console.log('🔔 Attempting to wake up Railway bot...');
    const response = UrlFetchApp.fetch(RAILWAY_URL + '/', {
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
    
    const response = UrlFetchApp.fetch(RAILWAY_URL + '/webhook/order-ready', {
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
  
  // Create new trigger to run every 15 minutes
  ScriptApp.newTrigger('keepBotAwake')
    .timeBased()
    .everyMinutes(15)
    .create();
    
  console.log('✅ Railway bot trigger set up every 15 minutes');
}

function testRailwayBot() {
  console.log('🧪 Testing Railway bot connection...');
  keepBotAwake();
}
```

## 🎯 Railway Deployment Checklist

### Before Deployment:
- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] Environment variables set
- [ ] Code committed to GitHub

### After Deployment:
- [ ] Railway URL obtained
- [ ] Health check passes
- [ ] QR code generates
- [ ] Google Script configured
- [ ] Trigger set up
- [ ] Test message sent

## 📊 Railway Usage Monitoring

### Check Usage:
1. Go to Railway dashboard
2. Click on your project
3. Check **Usage** tab
4. Monitor:
   - **CPU usage**
   - **Memory usage**
   - **Network usage**
   - **Hours remaining**

### Expected Usage for 30-40 messages/day:
- **CPU**: < 10% average
- **Memory**: < 200MB average
- **Network**: < 1GB/month
- **Hours**: < 100 hours/month

## 🔧 Troubleshooting Railway

### Common Issues:

1. **Build Fails**:
   - Check `package.json` scripts
   - Verify Node.js version
   - Check build logs

2. **App Crashes**:
   - Check memory usage
   - Reduce `NODE_OPTIONS` memory limit
   - Check application logs

3. **QR Not Generating**:
   - Check Chrome dependencies
   - Verify Puppeteer installation
   - Check application logs

4. **Google Script Fails**:
   - Verify Railway URL is correct
   - Check trigger is active
   - Test manual ping

## 🎉 Success Indicators

### Railway Deployment:
- ✅ **App deploys successfully**
- ✅ **Health check returns 200**
- ✅ **QR code generates**
- ✅ **WhatsApp authenticates**
- ✅ **Messages send successfully**

### Google Script:
- ✅ **Trigger runs every 15 minutes**
- ✅ **Health checks pass**
- ✅ **Bot stays awake**
- ✅ **Test messages work**

## 💰 Cost Summary

| Service | Cost | Usage |
|---------|------|-------|
| Railway | **Free** | 500 hours/month |
| Google Apps Script | **Free** | Unlimited triggers |
| WhatsApp | **Free** | Personal messages |
| **Total** | **$0** | **Forever** |

Your Railway + Google Script setup will give you a **completely free, reliable WhatsApp bot** that never sleeps! 🚀
