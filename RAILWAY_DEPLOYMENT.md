# Railway Deployment Guide for WhatsApp Bot

## Quick Deploy to Railway

### Option 1: One-Click Deploy (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### Option 2: Manual Deployment

1. **Fork this repository** to your GitHub account

2. **Install Railway CLI** (optional but recommended):
   ```bash
   npm install -g @railway/cli
   ```

3. **Connect to Railway**:
   - Go to [Railway.app](https://railway.app)
   - Sign up with GitHub
   - Create a new project
   - Connect your forked repository

4. **Set Environment Variables** in Railway dashboard:
   ```
   NODE_ENV=production
   RAILWAY=true
   PORT=8080
   SEND_DELAY_MS=1000
   NODE_OPTIONS=--max-old-space-size=512 --expose-gc --optimize-for-size
   SHOP_NAME=Your Shop Name
   SHOP_PHONE=Your Shop Phone
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
   ```

5. **Deploy**: Railway will automatically deploy from your repository

## WhatsApp Authentication

After deployment:

1. **Get your Railway URL** (e.g., `https://your-app.railway.app`)

2. **Open QR Scanner**: Visit `https://your-app.railway.app/scanner`

3. **Scan QR Code**: Use WhatsApp mobile app to scan the QR code

4. **Verify Connection**: Check `https://your-app.railway.app/session-status`

## Testing the Bot

Send a POST request to test:
```bash
curl -X POST https://your-app.railway.app/webhook/order-ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "1234567890",
    "item": "Shirt",
    "dueDate": "2024-01-15",
    "price": 500
  }'
```

## Important Notes

- **Memory Limits**: Railway provides 512MB RAM on free tier - this bot is optimized for that
- **Persistent Storage**: Sessions are stored in container, may reset on redeploys
- **Domain**: Railway provides a custom domain for your app
- **Logs**: Use `railway logs` command or Railway dashboard to view logs
- **Auto-Deploy**: Pushes to main branch auto-deploy to Railway

## Troubleshooting

### Common Issues:

1. **Memory Errors**: Bot is optimized for Railway's memory limits
2. **WhatsApp Disconnection**: Re-scan QR code at `/scanner` endpoint
3. **Deployment Fails**: Check Railway build logs for specific errors

### Health Checks:
- Basic: `GET /`
- Detailed: `GET /healthz`
- Session: `GET /session-status`

### Support:
- Railway Docs: https://docs.railway.app
- WhatsApp Web.js: https://wwebjs.dev

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `RAILWAY` | `true` | Platform identifier |
| `PORT` | `8080` | Server port |
| `SEND_DELAY_MS` | `1000` | Delay between messages |
| `SHOP_NAME` | `RS Tailors & Fabric` | Your shop name |
| `SHOP_PHONE` | `8824781960` | Your shop phone |
| `NODE_OPTIONS` | Memory flags | Node.js optimization |
