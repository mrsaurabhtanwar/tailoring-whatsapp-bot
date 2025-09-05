# WhatsApp Tailoring Shop Bot

A WhatsApp automation bot for tailoring shops that sends order ready notifications to customers.

## Features

- 📱 WhatsApp message automation via whatsapp-web.js
- 🔗 Webhook integration for order notifications
- 📷 QR code authentication with session persistence
- ☁️ Ready for Azure F1 (Free Tier) deployment
- 🛡️ Memory-optimized with throttling and health checks

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/mrsaurabhtanwar/tailoring-whatsapp-bot.git
cd tailoring-whatsapp-bot
npm install
```

### 2. Local Development

```bash
# Start the application
npm start

# Or for development with auto-restart
npm run dev
```

### 3. Authenticate WhatsApp

1. Visit `http://localhost:5000/scanner` in your browser
2. Open WhatsApp on your mobile phone
3. Go to **Settings** → **Linked Devices** → **Link a Device**
4. Scan the QR code displayed
5. Wait for authentication success message

### 4. Test Your Bot

Send a POST request to `/webhook/order-ready`:

```bash
curl -X POST http://localhost:5000/webhook/order-ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe", 
    "phone": "9876543210",
    "item": "Formal Shirt",
    "dueDate": "2024-01-20"
  }'
```

## Deploy to Azure F1 (Free Tier)

### Prerequisites

1. **Install Azure CLI**: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
2. **Azure Account**: Get free account at https://azure.microsoft.com/free/students
3. **GitHub Account**: For automated deployments

### Option 1: Automated Deployment (Recommended)

```bash
# Clone the repository
git clone https://github.com/mrsaurabhtanwar/tailoring-whatsapp-bot.git
cd tailoring-whatsapp-bot

# Make scripts executable
chmod +x verify.sh deploy.sh

# Run verification locally first
./verify.sh

# Login to Azure
az login

# Deploy to Azure (creates all resources automatically)
export APP_NAME="your-unique-bot-name-2024"
./deploy.sh --app-name $APP_NAME
```

### Option 2: Manual Azure Setup

#### Step 1: Create Azure Resources

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Create resource group in Central India
az group create --name whatsapp-bot-rg --location centralindia

# Create App Service Plan (F1 Free Tier)
az appservice plan create \
  --name whatsapp-bot-plan \
  --resource-group whatsapp-bot-rg \
  --location centralindia \
  --is-linux \
  --sku F1

# Create Web App with Node.js 18 runtime
az webapp create \
  --resource-group whatsapp-bot-rg \
  --plan whatsapp-bot-plan \
  --name YOUR_UNIQUE_APP_NAME \
  --runtime "NODE|18-lts"
```

#### Step 2: Configure App Settings

```bash
# Set recommended app settings for F1 tier
az webapp config appsettings set \
  --resource-group whatsapp-bot-rg \
  --name YOUR_APP_NAME \
  --settings \
    WEBSITE_NODE_DEFAULT_VERSION=18.15.0 \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    NODE_ENV=production \
    WEBSITE_RUN_FROM_PACKAGE=1 \
    SEND_DELAY_MS=600
```

#### Step 3: Deploy Your Code

```bash
# Create deployment package
zip -r whatsapp-bot.zip . \
  -x "node_modules/*" ".git/*" "*.log" ".env*" \
  -x ".wwebjs_auth/*" "current-qr.png"

# Deploy to Azure
az webapp deploy \
  --resource-group whatsapp-bot-rg \
  --name YOUR_APP_NAME \
  --src-path whatsapp-bot.zip \
  --type zip
```

### Option 3: GitHub Actions (CI/CD)

#### Step 1: Get Publish Profile

```bash
# Get publish profile for GitHub Actions
az webapp deployment list-publishing-profiles \
  --name YOUR_APP_NAME \
  --resource-group whatsapp-bot-rg \
  --xml > publish_profile.xml

# Copy the XML content from the file
cat publish_profile.xml
```

#### Step 2: Setup GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:
   - `AZURE_WEBAPP_PUBLISH_PROFILE`: Paste the XML content from above
   - `AZURE_WEBAPP_NAME`: Your app name (e.g., `my-whatsapp-bot-2024`)

#### Step 3: Deploy

- Push to `main` branch to trigger automatic deployment, or
- Go to **Actions** tab → **"CI & Deploy to Azure"** → **Run workflow**

#### Step 4: Monitor Deployment

```bash
# Check deployment status in GitHub Actions
# Verify health after deployment
curl https://YOUR_APP_NAME.azurewebsites.net/health

# Stream application logs
az webapp log tail --name YOUR_APP_NAME --resource-group whatsapp-bot-rg
```

## Post-Deployment Setup

### 1. Verify Deployment

Visit your app URLs:
- **App Status**: `https://YOUR_APP_NAME.azurewebsites.net`
- **Health Check**: `https://YOUR_APP_NAME.azurewebsites.net/health`
- **QR Scanner**: `https://YOUR_APP_NAME.azurewebsites.net/scanner`

### 2. Authenticate WhatsApp

1. Visit `https://YOUR_APP_NAME.azurewebsites.net/scanner`
2. Scan QR code with WhatsApp mobile app
3. Wait for "WhatsApp Client is ready!" message

### 3. Test Webhook

```bash
curl -X POST https://YOUR_APP_NAME.azurewebsites.net/webhook/order-ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "phone": "9876543210",
    "item": "Test Order",
    "dueDate": "2024-01-25"
  }'
```

## Local Development & Testing

### Run Verification Script

```bash
# Test your app locally before deploying
chmod +x ./verify.sh
./verify.sh
```

### Development Server

```bash
# Start with development settings
npm run dev

# Start with production settings (matches Azure)
NODE_ENV=production npm start
```

### Manual Testing

```bash
# Install dependencies
npm ci

# Check health endpoint
curl http://localhost:5000/health

# Test all endpoints
curl http://localhost:5000/                    # App status
curl http://localhost:5000/qr                  # QR code (may return 404 initially)
curl http://localhost:5000/session-status      # WhatsApp session info
```

## Azure Management Commands

### Monitor Your App

```bash
# Stream live logs
az webapp log tail --name YOUR_APP_NAME --resource-group whatsapp-bot-rg

# Download log files
az webapp log download --name YOUR_APP_NAME --resource-group whatsapp-bot-rg

# Check app status
az webapp show --name YOUR_APP_NAME --resource-group whatsapp-bot-rg --query "state"
```

### App Management

```bash
# Restart app
az webapp restart --name YOUR_APP_NAME --resource-group whatsapp-bot-rg

# Stop/Start app
az webapp stop --name YOUR_APP_NAME --resource-group whatsapp-bot-rg
az webapp start --name YOUR_APP_NAME --resource-group whatsapp-bot-rg

# View configuration
az webapp config appsettings list --name YOUR_APP_NAME --resource-group whatsapp-bot-rg
```

### Update App Settings

```bash
# Add new environment variable
az webapp config appsettings set \
  --name YOUR_APP_NAME \
  --resource-group whatsapp-bot-rg \
  --settings "NEW_SETTING=value"

# Update existing setting
az webapp config appsettings set \
  --name YOUR_APP_NAME \
  --resource-group whatsapp-bot-rg \
  --settings "SEND_DELAY_MS=800"
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | App status and health information |
| `/health` | GET | Health check (200 when ready) |
| `/healthz` | GET | Strict health check for monitoring |
| `/scanner` | GET | QR scanner page for authentication |
| `/qr` | GET | QR code image for WhatsApp auth |
| `/session-status` | GET | WhatsApp session information |
| `/webhook/order-ready` | POST | Send order ready notifications |
| `/cleanup` | POST | Manual memory cleanup |

## Webhook Payload

### Required Fields
```json
{
  "name": "Customer Name",
  "phone": "9876543210",
  "item": "Order Description"
}
```

### Optional Fields
```json
{
  "name": "John Doe",
  "phone": "9876543210", 
  "item": "Formal Shirt",
  "orderId": "ORD-123",
  "orderDate": "2024-01-15",
  "dueDate": "2024-01-20",
  "price": 1500,
  "advancePayment": 500,
  "remainingAmount": 1000,
  "shopName": "RS Tailors & Fabric",
  "shopPhone": "8824781960"
}
```

## Azure F1 Tier Optimization

### Benefits of F1 Tier
- ✅ **Always Free**: $0 cost forever
- ✅ **Always On**: No sleeping like Heroku
- ✅ **165 min/day CPU**: Perfect for WhatsApp bot usage
- ✅ **1GB Storage**: Sufficient for your app
- ✅ **SSL Included**: HTTPS by default
- ✅ **Custom Domains**: Supported

### Performance Considerations
- **CPU Usage**: ~15-20 minutes/day for typical usage
- **Memory**: Optimized for <1GB usage
- **Response Time**: Usually <2 seconds
- **Uptime**: 99.9%+ availability

### Monitoring Usage
```bash
# Check current resource usage
az monitor metrics list \
  --resource "/subscriptions/YOUR_SUBSCRIPTION/resourceGroups/whatsapp-bot-rg/providers/Microsoft.Web/sites/YOUR_APP_NAME" \
  --metric "CpuTime,MemoryWorkingSet,HttpRequestsPerMinute"
```

## Troubleshooting

### Common Issues

#### 1. WhatsApp Authentication Failed
```bash
# Check session status
curl https://YOUR_APP_NAME.azurewebsites.net/session-status

# Clear session and re-authenticate
# Visit /scanner endpoint and scan new QR code
```

#### 2. App Not Responding
```bash
# Check app status
az webapp show --name YOUR_APP_NAME --resource-group whatsapp-bot-rg

# Restart if needed
az webapp restart --name YOUR_APP_NAME --resource-group whatsapp-bot-rg

# Check logs
az webapp log tail --name YOUR_APP_NAME --resource-group whatsapp-bot-rg
```

#### 3. Deployment Failed
```bash
# Check deployment status
az webapp deployment list --name YOUR_APP_NAME --resource-group whatsapp-bot-rg

# Verify local verification passes
./verify.sh

# Try manual deployment
./deploy.sh --app-name YOUR_APP_NAME
```

#### 4. Memory Issues on F1 Tier
```bash
# Check memory usage
curl https://YOUR_APP_NAME.azurewebsites.net/

# Force memory cleanup
curl -X POST https://YOUR_APP_NAME.azurewebsites.net/cleanup
```

### Getting Help

1. **Check logs**: `az webapp log tail --name YOUR_APP_NAME --resource-group whatsapp-bot-rg`
2. **Verify health**: Visit `/health` endpoint
3. **Test locally**: Run `./verify.sh` 
4. **GitHub Issues**: Create issue with logs and error details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run `./verify.sh` to test locally
4. Submit a pull request with the checklist completed

## Dependencies

- `express` - Web framework
- `whatsapp-web.js` - WhatsApp Web API
- `bottleneck` - Rate limiting
- `qrcode` - QR code generation
- `axios` - HTTP client
- `dotenv` - Environment configuration

## License

MIT License - See LICENSE file for details
