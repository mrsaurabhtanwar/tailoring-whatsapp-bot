# Tailoring WhatsApp Bot - Render Optimized

A lightweight WhatsApp automation bot for tailoring shops to send order ready notifications to customers. Optimized for Render deployment with session persistence and memory efficiency.

## Features

- ✅ **Lightweight & Memory Optimized** - Uses only 256MB memory limit
- ✅ **Session Persistence** - WhatsApp sessions saved to disk storage
- ✅ **Render Ready** - Pre-configured for Render deployment
- ✅ **Auto QR Generation** - Automatic QR code generation for authentication
- ✅ **Webhook API** - Simple REST API for order notifications
- ✅ **Health Monitoring** - Built-in health checks and monitoring

## Quick Deploy to Render

### Option 1: One-Click Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Option 2: Manual Deploy

1. **Fork this repository** to your GitHub account
2. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub
   - Click "New +" → "Web Service"
   - Connect your forked repository

3. **Configure the service:**
   - **Name:** `tailoring-whatsapp-bot`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Starter` (Free tier)

4. **Add Environment Variables:**
   - `NODE_ENV` = `production`
   - `RENDER` = `true`
   - `SEND_DELAY_MS` = `1000`

5. **Deploy!** Click "Create Web Service"

## Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd tailoring-whatsapp-bot

# Install dependencies
npm install

# Start development server
npm run dev

# Access the application
# Health check: http://localhost:5000/
# QR Code: http://localhost:5000/qr
```

## API Usage

### Send Order Ready Notification

```bash
curl -X POST https://your-app.onrender.com/webhook/order-ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "9876543210",
    "item": "Formal Suit",
    "orderId": "ORD-001",
    "dueDate": "2024-01-15",
    "price": 2500,
    "advancePayment": 1000,
    "remainingAmount": 1500
  }'
```

### Check Bot Status

```bash
curl https://your-app.onrender.com/session-status
```

## WhatsApp Setup

1. **Deploy to Render** (follow steps above)
2. **Access your app** at `https://your-app.onrender.com`
3. **Get QR Code** at `https://your-app.onrender.com/qr`
4. **Scan QR Code** with your WhatsApp mobile app
5. **Bot is ready!** Check status at `/session-status`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `RENDER` | Render deployment flag | `true` |
| `SEND_DELAY_MS` | Delay between messages | `1000` |
| `SHOP_NAME` | Your shop name | `RS Tailors & Fabric` |
| `SHOP_PHONE` | Your shop phone | `8824781960` |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check and bot status |
| `/healthz` | GET | Strict health check for monitoring |
| `/qr` | GET | Get QR code for WhatsApp authentication |
| `/scanner` | GET | QR scanner page |
| `/session-status` | GET | Detailed session information |
| `/webhook/order-ready` | POST | Send order ready notification |
| `/cleanup` | POST | Force memory cleanup |

## Memory Optimization

This bot is optimized for Render's free tier:
- **Memory Limit:** 256MB (vs 512MB in previous versions)
- **Puppeteer Optimization:** Minimal Chrome flags for low memory usage
- **Session Persistence:** WhatsApp sessions saved to external storage (JSONBin/MongoDB)
- **Auto Cleanup:** Automatic memory management and garbage collection

## Free Tier Session Persistence

**⚠️ Important:** Render's free tier has ephemeral filesystem - local session data is lost on restart.

**✅ Solution:** External session storage is built-in! Choose your preferred option:

### Quick Setup with JSONBin (Recommended)
1. Create free account at [jsonbin.io](https://jsonbin.io)
2. Get API key and Bin ID
3. Add environment variables to Render:
   ```
   SESSION_STORAGE_TYPE=jsonbin
   JSONBIN_API_KEY=your_api_key
   JSONBIN_BIN_ID=your_bin_id
   ```
4. Deploy and scan QR once - session persists forever!

📖 **Detailed Guide:** See [FREE_TIER_SESSION_GUIDE.md](FREE_TIER_SESSION_GUIDE.md)

## Troubleshooting

### Bot Not Responding
1. Check `/session-status` endpoint
2. If session expired, scan QR code again at `/qr`
3. Check Render logs for errors

### Memory Issues
1. Use `/cleanup` endpoint to force garbage collection
2. Restart the service in Render dashboard
3. Check memory usage in Render metrics

### WhatsApp Authentication
1. Ensure you scan the QR code within 2 minutes
2. Use the same phone number consistently
3. Don't use WhatsApp Web on multiple devices

## Support

For issues and questions:
1. Check Render service logs
2. Verify environment variables
3. Test with `/session-status` endpoint
4. Ensure WhatsApp session is active

## License

MIT License - Feel free to use and modify for your tailoring business!