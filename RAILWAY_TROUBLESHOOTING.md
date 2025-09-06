# Railway Deployment Troubleshooting 🔧

## Common Build Issues and Solutions

### Issue: Package Lock Version Conflicts

**Error Message:**
```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync
npm error Invalid: lock file's puppeteer@24.19.0 does not satisfy puppeteer@23.11.1
```

**Solution:**
This happens when package-lock.json has different versions than package.json. We've already fixed this in the configuration.

**What we've done:**
1. ✅ Updated Dockerfile to remove package-lock.json before install
2. ✅ Updated nixpacks.toml to remove package-lock.json before install  
3. ✅ Added package-lock.json to .railwayignore
4. ✅ Updated package.json with compatible versions
5. ✅ Added clean-install script

### Manual Fix (if needed):

If you still encounter this issue:

1. **Remove package-lock.json locally:**
   ```bash
   rm -f package-lock.json
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

3. **Install fresh dependencies:**
   ```bash
   npm install --no-package-lock
   ```

4. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Fix package lock conflicts"
   git push
   ```

---

## Other Common Issues

### 1. Memory Issues During Build

**Error:** Out of memory during npm install

**Solution:**
- Railway automatically handles this with our optimized configuration
- We use `--max-old-space-size=512` in start command
- Dependencies are installed with `--no-audit --no-fund` for speed

### 2. Puppeteer Chrome Installation

**Error:** Chrome not found or installation failed

**Solution:**
- ✅ Dockerfile includes all required Chrome dependencies
- ✅ PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false ensures Chrome is installed
- ✅ Railway's container includes Chrome-compatible libraries

### 3. WhatsApp Authentication Issues

**Error:** QR code not loading or session fails

**Solutions:**
1. Wait 2-3 minutes after deployment for full initialization
2. Visit `/scanner` endpoint to get QR code
3. Clear browser cache if QR code doesn't load
4. Re-scan QR code if session expires

### 4. Port Issues

**Error:** Application not accessible or health checks failing

**Solution:**
- ✅ Port is set to 8080 (Railway default)
- ✅ Environment variable PORT=8080 is configured
- ✅ Health check endpoints are working

### 5. Environment Variables Missing

**Error:** Application crashes with missing config

**Required Environment Variables:**
```
NODE_ENV=production
RAILWAY=true
PORT=8080
SEND_DELAY_MS=1000
SHOP_NAME=Your Shop Name
SHOP_PHONE=Your Shop Phone
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

---

## Debugging Steps

### 1. Check Railway Build Logs
1. Go to Railway dashboard
2. Select your project
3. Click on "Deployments"
4. View build logs for errors

### 2. Check Runtime Logs
1. In Railway dashboard
2. Go to "Observability" > "Logs"
3. Look for application startup errors

### 3. Test Health Endpoints
After deployment, test these URLs:
- `https://your-app.railway.app/` - Basic health check
- `https://your-app.railway.app/healthz` - Strict health check
- `https://your-app.railway.app/scanner` - QR code page

### 4. Verify Environment Variables
1. In Railway dashboard
2. Go to "Variables" tab
3. Ensure all required variables are set

---

## Performance Optimization

### Memory Usage
- Monitor memory in Railway dashboard
- Use `/cleanup` endpoint if memory is high
- Memory limit is 512MB for Railway

### Response Times
- Health checks should respond in <2 seconds
- QR code generation may take 30-60 seconds on first load
- WhatsApp initialization takes 2-3 minutes

### Session Persistence
- Sessions are stored locally in container
- May need re-authentication after redeployments
- Use `/session-status` to check authentication state

---

## Getting Help

### Railway Support
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Help Center](https://help.railway.app)

### Project Support
- Check [GitHub Issues](https://github.com/mrsaurabhtanwar/tailoring-whatsapp-bot/issues)
- Create new issue with deployment logs
- Include Railway deployment URL and error messages

### Quick Fixes
1. **Redeploy**: Sometimes a simple redeploy fixes temporary issues
2. **Clear Railway cache**: Delete and recreate the service
3. **Check dependencies**: Ensure all packages are compatible
4. **Environment reset**: Remove and re-add environment variables

---

## Success Checklist

After fixing issues, verify:
- [ ] Build completes successfully
- [ ] Application starts without errors
- [ ] Health endpoints return 200
- [ ] QR code loads at `/scanner`
- [ ] Memory usage under 400MB
- [ ] WhatsApp authentication works
- [ ] Test webhook receives and processes messages

**Your Railway deployment should now be working! 🚀**
