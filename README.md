# 🧵 Tailoring WhatsApp Bot - Memory Optimized

A lightweight WhatsApp automation bot for tailoring shops, optimized for Render's free tier with advanced memory management and session persistence.

## 🌟 Features

- ✅ Order ready notifications in Hindi
- 📱 QR code authentication system
- 💾 Session persistence with external storage
- 🔄 Auto-reconnection with keep-alive
- 📊 Advanced memory optimization (60-80MB usage)
- 🎯 Rate limiting and message queuing
- 🔧 Health checks and monitoring
- 🛡️ Memory Guardian for crash prevention
- 💓 Session Keep-Alive for connection stability

## 🚀 Quick Deploy to Render

### Option 1: One-Click Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mrsaurabhtanwar/tailoring-whatsapp-bot)

### Option 2: Manual Deploy

1. **Fork this repository** to your GitHub account

2. **Connect to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repo

3. **Configure the service:**
   - **Name:** `tailoring-whatsapp-bot`
   - **Branch:** `main`
   - **Build Command:** `npm cache clean --force && npm ci --no-audit --no-fund --prefer-offline --timeout=300000`
   - **Start Command:** `npm start`

4. **Set Environment Variables:**
   ```
   NODE_ENV=production
   RENDER=true
   SEND_DELAY_MS=600
   JSONBIN_API_KEY=your_jsonbin_api_key
   JSONBIN_BIN_ID=your_jsonbin_bin_id
   JSONBIN_MASTER_KEY=your_jsonbin_master_key
   ```

5. **Deploy** and wait for the build to complete

## 📱 Setup WhatsApp Authentication

1. **Access your deployed service:** `https://your-app-name.onrender.com`

2. **Scan QR Code:**
   - Visit: `https://your-app-name.onrender.com/scanner`
   - Or get QR directly: `https://your-app-name.onrender.com/qr`
   - Scan with WhatsApp → Settings → Linked Devices → Link a Device

3. **Verify Status:**
   - Check: `https://your-app-name.onrender.com/session-status`
   - Should show `"authenticated": true`

## 🔧 API Usage

### Send Order Ready Notification

```bash
curl -X POST https://your-app-name.onrender.com/webhook/order-ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "राहुल शर्मा",
    "phone": "9876543210",
    "item": "शर्ट",
    "orderId": "ORD123",
    "dueDate": "2024-01-15",
    "price": 1500,
    "advancePayment": 500,
    "remainingAmount": 1000
  }'
```

### Health Check
```bash
curl https://your-app-name.onrender.com/healthz
```

## 🛠 Troubleshooting

### Build Issues
If npm install gets stuck:

1. **Check build logs** in Render dashboard
2. **Try manual redeploy** with cache clearing
3. **Use alternative build command:**
   ```bash
   rm -f package-lock.json && npm cache clean --force && npm install --no-package-lock --timeout=300000
   ```

### WhatsApp Connection Issues
- **QR Code not loading:** Wait 2-3 minutes after deployment
- **Authentication failed:** Clear browser cache and try new QR
- **Session lost:** Re-scan QR code, sessions persist automatically

### Memory Issues
- Monitor memory usage: `https://your-app-name.onrender.com/`
- Manual cleanup: `POST https://your-app-name.onrender.com/cleanup`
- Check memory optimization guide: `MEMORY_OPTIMIZATION_GUIDE.md`

### Session Disconnections
- Verify JSONBin credentials are set
- Check session status: `/session-status`
- Monitor keep-alive logs for connection health

## 📦 Local Development

```bash
# Clone repository
git clone https://github.com/mrsaurabhtanwar/tailoring-whatsapp-bot.git
cd tailoring-whatsapp-bot

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Start development server
npm run dev
```

## 🔒 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `SEND_DELAY_MS` | `600` | Message sending delay |
| `SHOP_NAME` | `RS Tailors & Fabric` | Your shop name |
| `SHOP_PHONE` | `8824781960` | Your shop phone |
| `JSONBIN_API_KEY` | - | JSONBin API key for session storage |
| `JSONBIN_BIN_ID` | - | JSONBin bin ID for session storage |
| `JSONBIN_MASTER_KEY` | - | JSONBin master key for write access |
| `SESSION_STORAGE_TYPE` | `jsonbin` | Session storage type (jsonbin/mongodb/file) |

## 📋 Message Templates

The bot supports multiple message types:
- `orderReady` - Order completion notification
- `orderConfirm` - Order confirmation
- `reminder` - Collection reminder
- `fittingReminder` - Fitting appointment
- `paymentReminder` - Payment due
- `festivalGreeting` - Festival wishes
- `delayNotification` - Delivery delay

## 🔧 Advanced Configuration

### Custom Message Templates
Edit `templates.js` to customize messages in Hindi/English.

### Session Storage
- **Local:** File-based (default)
- **JSONBin:** Set `JSONBIN_API_KEY` and `JSONBIN_BIN_ID`
- **MongoDB:** Set `MONGODB_URI`

### Rate Limiting
Adjust `SEND_DELAY_MS` to control message sending frequency.

## 📊 Monitoring

- **Health Check:** `/healthz`
- **Status:** `/`
- **Session Status:** `/session-status`
- **Memory Cleanup:** `POST /cleanup`
- **Memory Optimization Guide:** `MEMORY_OPTIMIZATION_GUIDE.md`

## 🛡️ Memory Management

The bot includes advanced memory management features:

- **Memory Guardian**: Monitors memory usage and triggers cleanup
- **Session Keep-Alive**: Prevents WhatsApp disconnections
- **Automatic Garbage Collection**: Runs every 30 seconds
- **Memory Thresholds**: Critical at 60MB, Emergency at 80MB
- **Session Persistence**: External storage with JSONBin

## 🆘 Support

For issues and support:
1. Check [Issues](https://github.com/mrsaurabhtanwar/tailoring-whatsapp-bot/issues)
2. Create new issue with logs
3. Contact: [Your Contact Info]

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for Tailoring Shops**