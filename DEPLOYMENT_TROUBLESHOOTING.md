# 🔧 Render Deployment Troubleshooting Guide

## Common npm install Issues

### Issue 1: npm install gets stuck or times out

**Symptoms:**
- Build hangs during "npm install"
- Timeout errors during dependency installation
- Build fails with network errors

**Solutions:**

1. **Clear cache and use optimized build command:**
   ```bash
   npm cache clean --force && npm ci --no-audit --no-fund --prefer-offline --timeout=300000
   ```

2. **Alternative build commands to try:**
   ```bash
   # Option A: Skip package-lock
   rm -f package-lock.json && npm install --no-package-lock --timeout=300000
   
   # Option B: Force clean install
   npm cache clean --force && npm install --prefer-offline --no-audit
   
   # Option C: Use yarn instead
   yarn install --prefer-offline --no-audit
   ```

3. **Check .npmrc configuration:**
   Ensure your `.npmrc` has proper timeout settings:
   ```
   fetch-retry-mintimeout=20000
   fetch-retry-maxtimeout=120000
   fetch-timeout=300000
   ```

### Issue 2: Puppeteer Chrome download fails

**Symptoms:**
- "Failed to download Chromium" errors
- Chrome binary not found

**Solutions:**

1. **Use system Chrome (Recommended):**
   Set environment variables:
   ```
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
   ```

2. **Alternative Puppeteer config:**
   ```javascript
   // In whatsapp-client.js
   executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
   ```

### Issue 3: Memory errors during build

**Symptoms:**
- "JavaScript heap out of memory"
- Build crashes with memory errors

**Solutions:**

1. **Increase Node.js memory:**
   ```
   NODE_OPTIONS=--max-old-space-size=512
   ```

2. **Use lighter dependencies:**
   Consider switching to `puppeteer-core` if issues persist.

## WhatsApp Connection Issues

### Issue 1: QR Code not generating

**Symptoms:**
- `/qr` endpoint returns 404
- No QR code appears in logs

**Solutions:**

1. **Wait for initialization:**
   - Give the service 2-3 minutes after deployment
   - Check logs for "QR Code received" message

2. **Check WhatsApp client status:**
   ```bash
   curl https://your-app.onrender.com/session-status
   ```

3. **Restart the service:**
   - Go to Render dashboard
   - Click "Manual Deploy" to restart

### Issue 2: Authentication fails repeatedly

**Symptoms:**
- QR scan doesn't work
- "Authentication failed" errors

**Solutions:**

1. **Check device linking:**
   - Make sure you're using WhatsApp mobile app (not web)
   - Go to Settings → Linked Devices → Link a Device

2. **Clear browser cache:**
   - Clear cookies and cache for the QR scanner page
   - Try incognito/private browsing

3. **Use fresh QR code:**
   - Wait for a new QR to generate (they expire)
   - Don't reuse old QR codes

### Issue 3: Session not persisting

**Symptoms:**
- Need to scan QR after every restart
- Session lost on deployment

**Solutions:**

1. **Enable external session storage:**
   ```
   SESSION_STORAGE_TYPE=jsonbin
   JSONBIN_API_KEY=your_key
   JSONBIN_BIN_ID=your_bin_id
   ```

2. **Check session directory:**
   Ensure `.wwebjs_auth` folder is being created

## Performance Issues

### Issue 1: High memory usage

**Symptoms:**
- Service crashes with memory errors
- Slow response times

**Solutions:**

1. **Enable memory monitoring:**
   ```bash
   curl -X POST https://your-app.onrender.com/cleanup
   ```

2. **Optimize Puppeteer:**
   Add more memory-saving flags:
   ```javascript
   '--disable-background-timer-throttling',
   '--disable-backgrounding-occluded-windows',
   '--disable-renderer-backgrounding'
   ```

3. **Restart periodically:**
   Consider implementing automatic restarts for long-running instances

### Issue 2: Slow message sending

**Symptoms:**
- Messages take long to send
- Timeout errors

**Solutions:**

1. **Adjust rate limiting:**
   ```
   SEND_DELAY_MS=2000  # Increase delay between messages
   ```

2. **Check WhatsApp connection:**
   Verify bot is authenticated and connected

## Render-Specific Issues

### Issue 1: Service keeps sleeping (Free tier)

**Symptoms:**
- Service becomes unresponsive after inactivity
- Cold start delays

**Solutions:**

1. **Add uptime monitoring:**
   Use services like UptimeRobot to ping your app every 15 minutes

2. **Implement wake-up endpoint:**
   ```bash
   # Ping your service regularly
   curl https://your-app.onrender.com/healthz
   ```

### Issue 2: Build timeouts

**Symptoms:**
- Build exceeds 15-minute limit
- Build gets cancelled

**Solutions:**

1. **Optimize dependencies:**
   Remove unnecessary packages from package.json

2. **Use build cache:**
   Enable caching in your build process

3. **Split build steps:**
   Move heavy operations to runtime instead of build time

## Debug Commands

### Check service health:
```bash
curl https://your-app.onrender.com/
```

### Get detailed status:
```bash
curl https://your-app.onrender.com/session-status
```

### Force memory cleanup:
```bash
curl -X POST https://your-app.onrender.com/cleanup
```

### Test webhook:
```bash
curl -X POST https://your-app.onrender.com/webhook/order-ready \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"1234567890","item":"Test Item"}'
```

## Getting Help

1. **Check Render logs:**
   - Go to your service dashboard
   - Click on "Logs" tab
   - Look for error messages

2. **Monitor resource usage:**
   - Check CPU and memory metrics
   - Look for patterns in crashes

3. **Test locally first:**
   ```bash
   npm run dev
   # Test all endpoints locally before deploying
   ```

4. **Use deployment verification:**
   ```bash
   npm run test-deploy https://your-app.onrender.com
   ```

Remember: Most deployment issues are related to timeouts, memory limits, or network connectivity. The optimizations in this project should handle most common problems automatically.
