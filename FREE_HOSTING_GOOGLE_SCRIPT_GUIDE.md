# Free Hosting + Google Script Triggers for WhatsApp Bot

## 🎯 Strategy Overview

1. **Deploy to free hosting** (Railway/Render/Cyclic)
2. **Set up Google Apps Script** to ping your bot every 15 minutes
3. **Prevent sleep mode** with automated health checks
4. **Send 30-40 messages/day** reliably

## 🏆 Recommended Free Hosting

### 1. Railway (BEST CHOICE)
- ✅ **512MB RAM** - Perfect for Chrome/Puppeteer
- ✅ **500 hours/month** - More than enough for your usage
- ✅ **No sleep mode** - Always-on servers
- ✅ **Easy GitHub deployment**
- ✅ **Full Chrome support**

**Setup:**
1. Go to: https://railway.app
2. Sign up with GitHub
3. Connect your repository
4. Deploy automatically

### 2. Render
- ✅ **512MB RAM** - Good for Puppeteer
- ✅ **750 hours/month** - Even more generous
- ✅ **No sleep mode** on web services
- ✅ **Easy setup**

**Setup:**
1. Go to: https://render.com
2. Sign up with GitHub
3. Create Web Service
4. Connect repository

### 3. Cyclic
- ✅ **1GB RAM** - Best memory allocation
- ✅ **No-sleep deployments**
- ✅ **10,000 API requests**
- ✅ **Serverless cron tasks**

**Setup:**
1. Go to: https://cyclic.sh
2. Sign up with GitHub
3. Deploy from repository

## 🔧 Google Apps Script Setup

### Step 1: Create Google Apps Script

1. Go to: https://script.google.com
2. Click "New Project"
3. Replace the code with the script below

### Step 2: Google Apps Script Code

```javascript
// Google Apps Script to prevent WhatsApp bot from sleeping
// This script pings your bot every 15 minutes to keep it awake

function keepBotAwake() {
  // Replace with your actual bot URL
  const BOT_URL = 'https://your-bot-name.railway.app'; // or .render.com, .cyclic.app
  
  try {
    // Ping the health endpoint
    const response = UrlFetchApp.fetch(BOT_URL + '/healthz', {
      method: 'GET',
      muteHttpExceptions: true,
      timeout: 30000
    });
    
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log(`Health check: ${statusCode} - ${responseText}`);
    
    if (statusCode === 200) {
      console.log('✅ Bot is awake and healthy');
      
      // Optional: Send a test message to verify WhatsApp is working
      if (Math.random() < 0.1) { // 10% chance to send test message
        sendTestMessage();
      }
    } else {
      console.log(`⚠️ Bot responded with status: ${statusCode}`);
    }
    
  } catch (error) {
    console.log(`❌ Error pinging bot: ${error.toString()}`);
    
    // Try to wake up the bot by hitting the main endpoint
    try {
      const wakeResponse = UrlFetchApp.fetch(BOT_URL + '/', {
        method: 'GET',
        muteHttpExceptions: true,
        timeout: 30000
      });
      console.log(`Wake-up attempt: ${wakeResponse.getResponseCode()}`);
    } catch (wakeError) {
      console.log(`❌ Wake-up failed: ${wakeError.toString()}`);
    }
  }
}

function sendTestMessage() {
  const BOT_URL = 'https://your-bot-name.railway.app';
  
  try {
    // Send a test message to verify WhatsApp is working
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
    
    const response = UrlFetchApp.fetch(BOT_URL + '/webhook/order-ready', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(testMessage),
      muteHttpExceptions: true,
      timeout: 30000
    });
    
    const statusCode = response.getResponseCode();
    console.log(`Test message sent: ${statusCode}`);
    
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
    
  console.log('✅ Trigger set up to run every 15 minutes');
}

function testBot() {
  // Manual test function
  console.log('🧪 Testing bot connection...');
  keepBotAwake();
}
```

### Step 3: Configure Triggers

1. In Google Apps Script, click **Triggers** (clock icon)
2. Click **Add Trigger**
3. Set:
   - **Function**: `keepBotAwake`
   - **Event source**: Time-driven
   - **Type**: Minutes timer
   - **Interval**: Every 15 minutes
4. Click **Save**

### Step 4: Test the Setup

1. Run `testBot()` function manually
2. Check the logs to ensure it's working
3. Wait 15 minutes and check if trigger runs automatically

## 🚀 Deployment Steps

### For Railway:

1. **Update your bot URL** in Google Script
2. **Deploy to Railway**:
   ```bash
   git add .
   git commit -m "Deploy to Railway with Google Script triggers"
   git push origin main
   ```
3. **Get Railway URL**: `https://your-project-name.railway.app`
4. **Update Google Script** with your Railway URL

### For Render:

1. **Deploy to Render**:
   - Connect GitHub repository
   - Set build command: `npm install`
   - Set start command: `npm start`
2. **Get Render URL**: `https://your-project-name.onrender.com`
3. **Update Google Script** with your Render URL

### For Cyclic:

1. **Deploy to Cyclic**:
   - Connect GitHub repository
   - Automatic deployment
2. **Get Cyclic URL**: `https://your-project-name.cyclic.app`
3. **Update Google Script** with your Cyclic URL

## 📊 Monitoring & Maintenance

### Daily Checks:
- ✅ Google Script logs show successful pings
- ✅ Bot responds to health checks
- ✅ WhatsApp messages send successfully
- ✅ No sleep mode issues

### Weekly Checks:
- ✅ Review Google Script logs
- ✅ Check hosting platform usage
- ✅ Verify trigger is still active
- ✅ Test message sending

## 💰 Cost Breakdown

| Service | Cost | Usage |
|---------|------|-------|
| Railway/Render/Cyclic | **Free** | 30-40 messages/day |
| Google Apps Script | **Free** | 15-min pings |
| WhatsApp | **Free** | Personal messages |
| **Total** | **$0** | **Forever** |

## 🎯 Expected Results

- ✅ **Bot never sleeps** - Google Script keeps it awake
- ✅ **Reliable messaging** - 30-40 messages/day
- ✅ **Zero cost** - All services free
- ✅ **Easy maintenance** - Automated monitoring
- ✅ **Professional setup** - Production-ready

## 🔧 Troubleshooting

### If Bot Goes to Sleep:
1. Check Google Script logs
2. Verify trigger is active
3. Test manual ping
4. Check hosting platform status

### If Messages Fail:
1. Check WhatsApp client status
2. Verify session is active
3. Check hosting platform logs
4. Test with manual message

This setup gives you a **completely free, reliable WhatsApp bot** that never sleeps! 🎉
