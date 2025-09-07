# Repository Merge Guide

## 🔄 Merging with Existing tailoring-whatsapp-bot Repository

This guide helps you integrate the production-ready configuration with your existing repository.

### Files to Keep (Production Ready)
These files have been optimized for production deployment:

#### Core Files:
- ✅ **server.js** - Production-hardened Express server
- ✅ **whatsapp-client.js** - Optimized WhatsApp client
- ✅ **package.json** - Updated dependencies and scripts
- ✅ **templates.js** - Template system (if needed)

#### Deployment Files:
- ✅ **Dockerfile** - Production container configuration
- ✅ **.dockerignore** - Optimize build context
- ✅ **.github/workflows/azure-deploy.yml** - CI/CD pipeline
- ✅ **health-monitor.js** - System monitoring

#### Documentation:
- ✅ **AZURE_DEPLOYMENT.md** - Complete deployment guide
- ✅ **GITHUB_ACTIONS_SETUP.md** - GitHub Actions setup
- ✅ **REPOSITORY_MERGE.md** - This file

### Files to Remove/Replace
Remove these files from your existing repository:

#### Development/Testing Files:
- ❌ **qr-scanner.html** - Development QR scanner
- ❌ **qr-data-url.txt** - Temporary QR data
- ❌ **current-qr.png** - QR code image

#### Old Deployment Configs:
- ❌ **railway.json** - Failed Railway config
- ❌ **nixpacks.toml** - Railway specific config
- ❌ **replit.md** - Replit documentation

### Merge Process

#### Step 1: Backup Your Repository
```bash
# Create backup branch
git checkout -b backup-before-merge
git push origin backup-before-merge
```

#### Step 2: Copy Production Files
Copy these files from this folder to your existing repository:
- server.js
- whatsapp-client.js
- package.json
- Dockerfile
- .dockerignore
- health-monitor.js
- .github/workflows/azure-deploy.yml
- AZURE_DEPLOYMENT.md
- GITHUB_ACTIONS_SETUP.md

#### Step 3: Remove Old Files
Delete these from your existing repository:
- qr-scanner.html
- qr-data-url.txt
- current-qr.png
- railway.json
- nixpacks.toml
- replit.md

#### Step 4: Update Dependencies
```bash
# Install updated dependencies
npm install

# Test locally
npm test
npm start
```

#### Step 5: Commit Changes
```bash
git add .
git commit -m "feat: production-ready Azure deployment with CI/CD

- Enhanced server.js with production error handling
- Optimized whatsapp-client.js for cloud deployment
- Added Docker configuration for Azure App Service
- Implemented GitHub Actions CI/CD pipeline
- Added health monitoring and graceful shutdown
- Removed development and failed deployment configs"

git push origin main
```

### Configuration Updates

#### Environment Variables
Update your existing environment variables:

**Keep These (if you have them):**
- WhatsApp session data
- Business-specific configurations
- API keys and secrets

**Add These for Production:**
```env
NODE_ENV=production
SEND_DELAY_MS=600
WEBSITES_PORT=8080
```

#### Package.json Scripts
The new package.json includes:
- `start`: Production server startup
- `dev`: Development with nodemon
- `test`: Health check testing
- `docker:build`: Local Docker testing
- `docker:run`: Local container testing

### Azure Integration

#### Secret Configuration
Add these secrets to your GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Add required secrets (see GITHUB_ACTIONS_SETUP.md)

#### Resource Naming
If you want custom names, update these in the workflow:
- `AZURE_WEBAPP_NAME`: Your preferred app name
- `AZURE_RESOURCE_GROUP`: Your resource group
- `AZURE_REGISTRY_NAME`: Your container registry

### Testing Integration

#### Local Testing
```bash
# Test the production build
npm run docker:build
npm run docker:run

# Test endpoints
curl http://localhost:8080/health
curl http://localhost:8080/qr
```

#### Deployment Testing
1. Push to main branch
2. Monitor GitHub Actions
3. Check Azure App Service deployment
4. Verify app functionality

### Rollback Plan

If issues occur:
```bash
# Rollback to backup
git checkout backup-before-merge
git push origin main --force

# Or revert specific commit
git revert HEAD
git push origin main
```

### Post-Merge Checklist

- [ ] All production files copied
- [ ] Old development files removed
- [ ] Dependencies updated and tested
- [ ] Environment variables configured
- [ ] GitHub secrets added
- [ ] Azure resources created
- [ ] First deployment successful
- [ ] Health endpoints responding
- [ ] WhatsApp functionality working
- [ ] Monitoring setup verified

### Support

If you encounter issues:
1. Check GitHub Actions logs
2. Review Azure App Service logs
3. Verify all secrets are configured
4. Test locally with Docker first
5. Use the backup branch if needed

The production configuration is designed to be robust and handle the issues that caused Railway deployment failures.
