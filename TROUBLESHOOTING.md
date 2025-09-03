# WhatsApp Bot Troubleshooting Guide

## Common Issues and Solutions

### 1. API Gets Inactive After Few Minutes

**Problem**: Bot becomes inactive and takes time to send messages

**Root Causes**:
- WhatsApp Web connection timeouts
- Memory pressure causing restarts
- Puppeteer browser resource exhaustion
- Network connectivity issues

**Solutions Applied**:
- ✅ Added keep-alive mechanism (pings every 5 minutes)
- ✅ Increased memory threshold from 400MB to 600MB
- ✅ Enhanced Puppeteer arguments for better resource management
- ✅ Added retry mechanism for webhook requests
- ✅ Improved health check logic with state tracking

### 2. Client State "OPENING" Issues

**Problem**: Client gets stuck in "OPENING" state

**Solutions**:
- ✅ Added state tracking to only restart if stuck for >30 seconds
- ✅ Increased restart delay from 2s to 5s
- ✅ Increased max restart attempts from 5 to 10
- ✅ Added error persistence tracking

### 3. Memory Usage Fluctuations

**Problem**: Memory usage spikes causing restarts

**Solutions**:
- ✅ Increased memory threshold to 600MB
- ✅ Added more aggressive Puppeteer optimization flags
- ✅ Reduced health check frequency from 30s to 60s
- ✅ Added memory monitoring with cleanup endpoint

## Performance Optimizations

### Puppeteer Optimizations
```javascript
// Added these flags for better performance:
'--disable-extensions',
'--disable-plugins', 
'--disable-images',
'--disable-javascript',
'--disable-default-apps',
'--disable-sync',
'--disable-translate',
'--disable-logging',
'--disable-breakpad',
'--disable-component-extensions-with-background-pages',
'--disable-background-networking',
'--disable-client-side-phishing-detection',
'--disable-component-update',
'--disable-domain-reliability',
'--disable-features=TranslateUI',
'--disable-ipc-flooding-protection',
'--disable-software-rasterizer',
'--disable-threaded-animation',
'--disable-threaded-scrolling',
'--disable-webgl',
'--disable-webgl2',
'--enable-features=NetworkService,NetworkServiceLogging',
'--force-color-profile=srgb',
'--metrics-recording-only',
'--no-default-browser-check',
'--no-pings',
'--password-store=basic',
'--use-mock-keychain',
'--use-gl=swiftshader',
'--use-angle=swiftshader',
'--allow-running-insecure-content'
```

### Keep-Alive Mechanism
- Sends ping every 5 minutes to prevent timeouts
- Monitors connection state continuously
- Graceful restart on persistent issues

## Monitoring and Diagnostics

### Using the Monitor Script

```bash
# Install dependencies
npm install

# Check bot health
node monitor.js health

# Send test message
node monitor.js test

# Run full diagnostics
node monitor.js diagnose

# Start continuous monitoring (every 30 seconds)
node monitor.js monitor

# Start monitoring with custom interval (every 60 seconds)
node monitor.js monitor 60000
```

### Health Check Endpoints

```bash
# Check bot status
GET http://localhost:3000/

# Get QR code for authentication
GET http://localhost:3000/qr

# QR scanner page
GET http://localhost:3000/scanner

# Force memory cleanup
POST http://localhost:3000/cleanup
```

## Deployment Recommendations

### For Render.com
1. **Environment Variables**:
   ```bash
   NODE_ENV=production
   PORT=10000
   ```

2. **Build Command**:
   ```bash
   npm install
   ```

3. **Start Command**:
   ```bash
   npm start
   ```

4. **Health Check Path**:
   ```
   /
   ```

### Memory Management
- Monitor memory usage in logs
- Use cleanup endpoint if needed
- Consider upgrading to higher memory tier if issues persist

### Network Stability
- Ensure stable internet connection
- Consider using a VPS with better network reliability
- Monitor for network timeouts

## Debugging Steps

### 1. Check Bot Status
```bash
curl http://localhost:3000/
```

### 2. Monitor Logs
Look for these patterns:
- `⚠️ Client state is not CONNECTED: OPENING`
- `🔄 Restarting WhatsApp client...`
- `💾 Memory usage: XXMB`
- `💓 Keep-alive ping sent`

### 3. Test Message Sending
```bash
curl -X POST http://localhost:3000/webhook/order-ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "phone": "917078319637", 
    "item": "test shirt",
    "orderDate": "2025-01-02T18:30:00.000Z",
    "dueDate": "2025-01-05T18:30:00.000Z"
  }'
```

### 4. Force Cleanup
```bash
curl -X POST http://localhost:3000/cleanup
```

## Expected Behavior After Fixes

✅ **Improved Stability**:
- Fewer restarts
- Consistent connection state
- Faster message delivery

✅ **Better Resource Management**:
- Lower memory usage
- Reduced CPU spikes
- Stable performance

✅ **Enhanced Monitoring**:
- Real-time health checks
- Detailed error tracking
- Performance metrics

## When to Seek Further Help

Contact support if you experience:
- Persistent connection failures after 10+ restarts
- Memory usage consistently above 600MB
- Messages taking >30 seconds to send
- Complete service unavailability

## Emergency Recovery

If the bot becomes completely unresponsive:

1. **Restart the service**:
   ```bash
   # On Render.com, use the restart button
   # Or redeploy the application
   ```

2. **Clear authentication**:
   ```bash
   # Delete the auth folder (will require re-scanning QR)
   rm -rf .wwebjs_auth/
   ```

3. **Check system resources**:
   ```bash
   # Monitor CPU and memory usage
   top
   free -h
   ```

4. **Review logs**:
   ```bash
   # Check for error patterns
   tail -f logs/application.log
   ```
