# Free Tier Session Persistence Guide

## ❌ **Render Free Tier Limitations**

Render's free tier has **ephemeral filesystem**, meaning:
- ❌ All local data is lost on restart
- ❌ No persistent disk storage
- ❌ WhatsApp sessions are wiped after 15 minutes of inactivity
- ❌ Need to scan QR code again after every restart

## ✅ **Solution: External Session Storage**

I've added external session storage support to your bot! Here are your options:

### **Option 1: JSONBin.io (Recommended - FREE)**

JSONBin.io offers free JSON storage perfect for session data.

#### Setup Steps:

1. **Create JSONBin Account:**
   - Go to [jsonbin.io](https://jsonbin.io)
   - Sign up for free account
   - Create a new bin

2. **Get API Credentials:**
   - Copy your API Key from dashboard
   - Copy your Bin ID from the URL

3. **Add Environment Variables to Render:**
   ```
   SESSION_STORAGE_TYPE=jsonbin
   JSONBIN_API_KEY=your_api_key_here
   JSONBIN_BIN_ID=your_bin_id_here
   ```

4. **Deploy and Test:**
   - Deploy to Render
   - Scan QR code once
   - Session will be saved to JSONBin
   - Restart service - session will be restored!

### **Option 2: MongoDB Atlas (FREE)**

MongoDB Atlas offers free 512MB database.

#### Setup Steps:

1. **Create MongoDB Atlas Account:**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create free cluster
   - Get connection string

2. **Add Environment Variables to Render:**
   ```
   SESSION_STORAGE_TYPE=mongodb
   MONGODB_URI=your_mongodb_connection_string
   ```

### **Option 3: File Storage (Local Development Only)**

For local development, sessions are saved to local files.

```
SESSION_STORAGE_TYPE=file
```

## 🚀 **Quick Setup with JSONBin**

### Step 1: Create JSONBin Account
1. Visit [jsonbin.io](https://jsonbin.io)
2. Sign up with email
3. Create new bin
4. Copy API Key and Bin ID

### Step 2: Configure Render
1. Go to your Render service dashboard
2. Navigate to "Environment" tab
3. Add these environment variables:

```
SESSION_STORAGE_TYPE=jsonbin
JSONBIN_API_KEY=your_api_key_from_jsonbin
JSONBIN_BIN_ID=your_bin_id_from_jsonbin
NODE_ENV=production
RENDER=true
SEND_DELAY_MS=1000
```

### Step 3: Deploy and Test
1. Deploy your service
2. Visit your app URL
3. Go to `/qr` endpoint
4. Scan QR code with WhatsApp
5. Wait for "WhatsApp client is ready" message
6. **Session is now saved to JSONBin!**

### Step 4: Test Persistence
1. Restart your Render service
2. Check logs - you should see "Session restored from external storage"
3. WhatsApp should be ready without QR scan!

## 📊 **How It Works**

### Session Save Process:
1. WhatsApp authenticates successfully
2. Bot reads key session files from `.wwebjs_auth/`
3. Session data is uploaded to external storage
4. Data persists across restarts

### Session Restore Process:
1. Bot starts up
2. Downloads session data from external storage
3. Restores session files to `.wwebjs_auth/`
4. WhatsApp initializes with existing session
5. No QR scan needed!

## 🔧 **Environment Variables Reference**

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SESSION_STORAGE_TYPE` | Storage backend type | Yes | `jsonbin`, `mongodb`, `file` |
| `JSONBIN_API_KEY` | JSONBin API key | For JSONBin | `$2a$10$...` |
| `JSONBIN_BIN_ID` | JSONBin bin ID | For JSONBin | `507f1f77bcf86cd799439011` |
| `MONGODB_URI` | MongoDB connection string | For MongoDB | `mongodb+srv://...` |

## 🐛 **Troubleshooting**

### Session Not Restoring
1. Check environment variables are set correctly
2. Verify JSONBin API key and Bin ID
3. Check Render logs for error messages
4. Try clearing session and re-authenticating

### JSONBin Errors
1. Ensure API key has write permissions
2. Check if bin ID is correct
3. Verify JSONBin account is active

### MongoDB Errors
1. Check connection string format
2. Ensure database is accessible
3. Verify network access from Render

## 💡 **Pro Tips**

1. **JSONBin is recommended** - Simple, free, and reliable
2. **Test locally first** - Use `SESSION_STORAGE_TYPE=file` for development
3. **Monitor logs** - Check Render logs for session save/restore messages
4. **Backup sessions** - JSONBin allows you to view/backup session data
5. **Free tier limits** - JSONBin free tier has generous limits for session data

## 🎯 **Expected Behavior**

### First Time Setup:
1. Deploy to Render
2. Scan QR code
3. Session saved to external storage
4. WhatsApp ready

### After Restart:
1. Service starts
2. Session restored from external storage
3. WhatsApp ready immediately
4. No QR scan needed!

## 📈 **Cost Comparison**

| Solution | Cost | Storage | Reliability |
|----------|------|---------|-------------|
| **JSONBin Free** | $0 | 1GB | ⭐⭐⭐⭐⭐ |
| **MongoDB Atlas Free** | $0 | 512MB | ⭐⭐⭐⭐⭐ |
| **Render Paid Plan** | $7/month | 1GB | ⭐⭐⭐⭐⭐ |
| **No Persistence** | $0 | 0MB | ⭐ |

**Recommendation: Use JSONBin free tier for best free solution!**
