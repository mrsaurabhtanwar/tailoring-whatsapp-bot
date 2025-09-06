# 🔧 Render Environment Setup Guide

## **CRITICAL: Set These Environment Variables on Render Dashboard**

To prevent re-authentication after memory restarts, you MUST set these environment variables:

### **1. Go to Render Dashboard**
- Open your `tailoring-whatsapp-bot` service
- Click **Environment** tab

### **2. Add/Update These Variables:**

```bash
# Session Storage (REQUIRED for persistence)
SESSION_STORAGE_TYPE=jsonbin
JSONBIN_BIN_ID=68bb7fddd0ea881f40735642

# Authentication Keys (Use BOTH for maximum reliability)
JSONBIN_API_KEY=$2a$10$3T5PCL3b68w1tezArXVoMOF3So2ijFBwNKsjO9YuaN23WEpH5v0z2
JSONBIN_MASTER_KEY=$2a$10$CIdvKt1R9BAigkIQsTzla.4b86AV15WXqcMz2YBIYzAjQ9K2QbnQ.

# Node.js Memory Limits (CRITICAL for preventing crashes)
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=150 --expose-gc

# Other Settings
RENDER=true
SEND_DELAY_MS=1000
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_CACHE_DIR=/opt/render/project/src/.puppeteer_cache
```

### **3. Save and Deploy**
Click **Save Changes** - Render will automatically redeploy.

## **🛡️ Memory Management Solution**

### **New Memory Guardian Features:**
- **Monitors every 10 seconds** instead of 20
- **Critical threshold: 80MB** (down from 120MB)
- **Emergency threshold: 120MB** (down from 160MB)
- **Controlled restarts** before hitting 512MB crash limit
- **Emergency session backup** before each restart

### **Session Persistence Strategy:**
1. **Primary**: JSONBin with Master Key authentication
2. **Fallback**: JSONBin with Access Key authentication  
3. **Backup**: Local file storage (dual-save on external)
4. **Emergency**: Session backup before memory restarts

### **Memory Limits Reduced:**
- Node.js max memory: **150MB** (was 200MB)
- Critical warning: **80MB** (was 120MB)
- Emergency restart: **120MB** (was 160MB)

## **🚀 Expected Behavior After Deploy:**

### **Startup Logs:**
```
🛡️ Memory Guardian: Monitoring started
📦 Session Storage: jsonbin
✅ External session storage configured - sessions will persist across restarts
🔑 Will try 2 authentication method(s)
🔑 Trying X-Master-Key: $2a$10$CId...
✅ Session saved to JSONBin with X-Master-Key
```

### **Memory Monitoring:**
```
🛡️ Memory: 45MB (Heap: 32MB)
💾 Session saved to JSONBin with X-Master-Key
✅ Session saved to external storage successfully
```

### **Before Restart (if needed):**
```
⚠️ Critical Memory: 85MB (Warning 1/2)
🧹 Running emergency garbage collection...
🔄 CONTROLLED RESTART: Gracefully restarting...
💾 Emergency session backup created
```

### **After Restart:**
```
🔄 Session backup found: 2025-09-06T20:30:00.000Z
✅ WhatsApp client authenticated from stored session
✅ WhatsApp client is ready.
```

## **🎯 Problem Solved:**

1. **No More 512MB Crashes** - Memory Guardian prevents them
2. **No More Re-authentication** - Sessions persist via JSONBin
3. **Graceful Restarts** - Controlled before hitting memory limit
4. **Dual Backup System** - Both external + local session storage
5. **Aggressive Memory Management** - Proactive garbage collection

Your bot will now maintain WhatsApp authentication even through memory-driven restarts! 🚀
