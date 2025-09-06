# Railway Deployment Checklist ✅

## Pre-Deployment Checklist

### 1. Repository Setup
- [ ] Repository is public on GitHub
- [ ] All unnecessary files removed (Azure, Render configs)
- [ ] Railway configuration files added (`railway.toml`, `nixpacks.toml`)
- [ ] Updated README with Railway instructions

### 2. Code Optimization
- [ ] Memory settings optimized for Railway (512MB limit)
- [ ] Port updated to 8080 (Railway default)
- [ ] Environment detection includes Railway
- [ ] Dependencies are production-only

### 3. Configuration Files
- [ ] `railway.toml` - Railway deployment configuration
- [ ] `nixpacks.toml` - Build optimization for Nixpacks
- [ ] `Dockerfile` - Optimized for Railway
- [ ] `.railwayignore` - Exclude unnecessary files from deployment
- [ ] `package.json` - Railway-specific scripts and settings

## Railway Deployment Steps

### 1. Create Railway Account
- [ ] Sign up at [railway.app](https://railway.app)
- [ ] Connect GitHub account

### 2. Deploy Project
- [ ] Create new project on Railway
- [ ] Connect your forked repository
- [ ] Select main branch for deployment

### 3. Configure Environment Variables
Set these in Railway dashboard:

```
NODE_ENV=production
RAILWAY=true
PORT=8080
SEND_DELAY_MS=1000
NODE_OPTIONS=--max-old-space-size=512 --expose-gc --optimize-for-size
SHOP_NAME=Your Shop Name
SHOP_PHONE=Your Shop Phone Number
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

### 4. Deploy and Monitor
- [ ] Trigger deployment
- [ ] Monitor build logs
- [ ] Check deployment status
- [ ] Verify health endpoint works

## Post-Deployment Setup

### 1. WhatsApp Authentication
- [ ] Visit your Railway app URL
- [ ] Navigate to `/scanner` endpoint
- [ ] Scan QR code with WhatsApp mobile app
- [ ] Verify connection at `/session-status`

### 2. Test API
- [ ] Test health endpoint: `GET /healthz`
- [ ] Test webhook: `POST /webhook/order-ready`
- [ ] Verify message delivery

### 3. Monitor Performance
- [ ] Check memory usage via Railway dashboard
- [ ] Monitor response times
- [ ] Review application logs
- [ ] Set up uptime monitoring (optional)

## Troubleshooting Common Issues

### Build Failures
- [ ] Check Railway build logs
- [ ] Verify Node.js version compatibility (20.x)
- [ ] Ensure all dependencies are in `package.json`
- [ ] Check for memory issues during build

### Runtime Issues
- [ ] Verify environment variables are set correctly
- [ ] Check application logs for errors
- [ ] Test health endpoints
- [ ] Monitor memory usage

### WhatsApp Connection Issues
- [ ] Re-scan QR code if session expires
- [ ] Check session status endpoint
- [ ] Verify Puppeteer can launch Chrome
- [ ] Monitor session persistence

## Performance Monitoring

### Key Metrics to Watch
- [ ] Memory usage (should stay under 400MB)
- [ ] Response times for health checks
- [ ] WhatsApp session stability
- [ ] Message delivery success rate

### Railway Dashboard
- [ ] Set up deployment notifications
- [ ] Monitor resource usage
- [ ] Review build and runtime logs
- [ ] Configure custom domain (optional)

## Security Checklist

### Environment Variables
- [ ] All sensitive data in environment variables
- [ ] No hardcoded secrets in code
- [ ] Proper access controls for Railway project

### Application Security
- [ ] Input validation on webhook endpoints
- [ ] Rate limiting configured
- [ ] HTTPS enabled (automatic with Railway)
- [ ] Error handling doesn't expose sensitive data

## Maintenance

### Regular Tasks
- [ ] Monitor WhatsApp session health
- [ ] Check for dependency updates
- [ ] Review application logs
- [ ] Test backup and recovery procedures

### Updates
- [ ] Test changes in local environment first
- [ ] Use Railway's preview deployments for testing
- [ ] Monitor deployments for issues
- [ ] Keep environment variables updated

---

## Support Resources

- **Railway Documentation**: https://docs.railway.app
- **Project Repository**: https://github.com/mrsaurabhtanwar/tailoring-whatsapp-bot
- **WhatsApp Web.js Docs**: https://wwebjs.dev
- **Railway Discord**: https://discord.gg/railway

## Final Verification

After completing all steps above:

1. [ ] Application is accessible via Railway URL
2. [ ] Health checks return successful responses
3. [ ] WhatsApp authentication is working
4. [ ] Test messages are being delivered
5. [ ] Memory usage is within Railway limits
6. [ ] All logs show normal operation

**Your Railway deployment is ready! 🚀**
