# Azure Health Check Configuration Fix
# Fixing the incorrect health check endpoint configuration

## 🚨 Problem Identified

Azure is currently configured to use `/scanner` as the health check endpoint, but this is wrong because:

- ❌ **`/scanner` serves HTML** - Not a proper health check response
- ❌ **Returns 200 even when unhealthy** - Doesn't check WhatsApp status
- ❌ **Not designed for health monitoring** - Just serves a QR scanner page

## ✅ Solution

Your app already has proper health check endpoints:

### **Recommended: `/healthz`** (Strict Health Check)
- ✅ **Returns 200** when WhatsApp is ready
- ✅ **Returns 503** when WhatsApp is not ready
- ✅ **Perfect for Azure health checks**
- ✅ **Follows Kubernetes health check standards**

### **Alternative: `/health`** (Compatibility Health Check)
- ✅ **Same logic as `/healthz`**
- ✅ **Alternative endpoint name**

## 🔧 How to Fix

### **Option 1: Azure Portal (Recommended)**

1. **Go to Azure Portal**: https://portal.azure.com
2. **Search for**: `tailoring-whats-bot-hvheavb3bbhfbsdn`
3. **Navigate to**: **Settings** → **Configuration**
4. **Find**: **Health check** section
5. **Change Health check path** from `/scanner` to `/healthz`
6. **Click**: **Save**
7. **Restart** your app

### **Option 2: Azure CLI**

```bash
az webapp config set \
  --name tailoring-whats-bot-hvheavb3bbhfbsdn \
  --resource-group DefaultResourceGroup-CIN \
  --health-check-path /healthz
```

### **Option 3: Environment Variable**

Add this to your Azure App Settings:
```bash
WEBSITE_HEALTHCHECK_PATH=/healthz
```

## 📋 Health Check Endpoints Comparison

| Endpoint | Purpose | Response | Status Codes |
|----------|---------|----------|--------------|
| `/scanner` | QR Scanner Page | HTML | Always 200 |
| `/healthz` | **Strict Health Check** | JSON | 200 (healthy) / 503 (unhealthy) |
| `/health` | Compatibility Check | JSON | 200 (healthy) / 503 (unhealthy) |
| `/` | General Status | JSON | Always 200 |

## 🎯 Recommended Configuration

### **Health Check Path**: `/healthz`

**Why `/healthz` is best:**
- ✅ **Industry standard** - Used by Kubernetes, Docker, etc.
- ✅ **Proper status codes** - 200 for healthy, 503 for unhealthy
- ✅ **Checks WhatsApp status** - Returns unhealthy if WhatsApp not ready
- ✅ **Fast response** - Minimal processing time
- ✅ **Azure compatible** - Works perfectly with Azure health checks

## 🔍 Health Check Logic

Your `/healthz` endpoint checks:
- ✅ **WhatsApp client exists**
- ✅ **WhatsApp client is ready**
- ✅ **Returns proper status codes**

```javascript
app.get("/healthz", (req, res) => {
  const ok = typeof whatsappClient.isReady === "function" 
    ? whatsappClient.isReady() 
    : false;
  
  if (ok) return res.status(200).json({ ok: true });
  return res.status(503).json({ ok: false });
});
```

## 🚀 Additional Optimizations

### **1. Add Health Check Environment Variables**

In Azure Portal → Configuration → Application settings:

```bash
# Health check configuration
WEBSITE_HEALTHCHECK_PATH=/healthz
WEBSITE_HEALTHCHECK_MAXPINGFAILURES=5
WEBSITE_HEALTHCHECK_RETRYCOUNT=3
```

### **2. Improve Health Check Endpoint**

Let me enhance your health check to be more comprehensive:

```javascript
app.get("/healthz", (req, res) => {
  try {
    // Check WhatsApp client
    const whatsappReady = typeof whatsappClient.isReady === "function" 
      ? whatsappClient.isReady() 
      : false;
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memHealthy = memUsageMB < 1000; // Less than 1GB
    
    // Check if app is responsive
    const appHealthy = true; // App is running if this endpoint responds
    
    const overallHealthy = whatsappReady && memHealthy && appHealthy;
    
    if (overallHealthy) {
      return res.status(200).json({ 
        ok: true, 
        whatsappReady,
        memoryMB: memUsageMB,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(503).json({ 
        ok: false, 
        whatsappReady,
        memoryMB: memUsageMB,
        issues: [
          !whatsappReady && "WhatsApp not ready",
          !memHealthy && "High memory usage",
          !appHealthy && "App not responsive"
        ].filter(Boolean),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    return res.status(503).json({ 
      ok: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

## 📊 Expected Results

### **Before Fix:**
- ❌ Health check uses `/scanner` (HTML page)
- ❌ Always returns 200 (even when unhealthy)
- ❌ Doesn't check WhatsApp status
- ❌ Azure can't detect real health issues

### **After Fix:**
- ✅ Health check uses `/healthz` (proper endpoint)
- ✅ Returns 200 when healthy, 503 when unhealthy
- ✅ Checks WhatsApp status
- ✅ Azure can detect and handle health issues
- ✅ Better reliability and uptime

## 🎯 Next Steps

1. **Change health check path** to `/healthz` in Azure Portal
2. **Add health check environment variables**
3. **Restart your app**
4. **Test health check** - Visit `/healthz` endpoint
5. **Monitor Azure health check** status

## 💡 Pro Tips

1. **Use `/healthz`** - Industry standard for health checks
2. **Monitor the endpoint** - Check it regularly
3. **Add logging** - Log health check requests
4. **Test failure scenarios** - Ensure 503 is returned when unhealthy
5. **Consider multiple instances** - For better availability

Your health check will now work properly and Azure will be able to detect real health issues! 🎉
